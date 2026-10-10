const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 5;

// In-memory store for OTPs: phone -> { code, expiresAt, lastRequestedAt, attempts, verified }
// This avoids database schema alterations and works with any existing database on other systems.
const otpMemoryStore = new Map();

const generateCode = () => String(crypto.randomInt(100000, 999999));

/**
 * Dispatch real SMS using Twilio REST API (no extra npm packages required)
 */
const sendViaTwilio = (toPhone, text) => {
  return new Promise((resolve, reject) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
      return reject(new Error('Twilio credentials not configured in .env'));
    }

    // Format phone with +91 if 10 digits
    let formattedTo = toPhone.trim();
    if (!formattedTo.startsWith('+')) {
      formattedTo = formattedTo.length === 10 ? `+91${formattedTo}` : `+${formattedTo}`;
    }

    const postData = querystring.stringify({
      To: formattedTo,
      From: fromPhone,
      Body: text
    });

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const options = {
      hostname: 'api.twilio.com',
      port: 443,
      path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Basic ${auth}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Twilio HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

/**
 * Dispatch real SMS using Fast2SMS REST API (Fastest setup for Indian mobile numbers)
 */
const sendViaFast2Sms = (toPhone, code) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) return reject(new Error('FAST2SMS_API_KEY not configured in .env'));

    // Fast2SMS expects 10-digit number without country code
    const cleanNumber = toPhone.replace(/^\+91/, '').replace(/^\+/, '').trim();

    const postData = JSON.stringify({
      route: 'otp',
      variables_values: code,
      numbers: cleanNumber
    });

    const options = {
      hostname: 'www.fast2sms.com',
      port: 443,
      path: '/dev/bulkV2',
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.return === true || res.statusCode === 200) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.message || 'Fast2SMS returned error'));
          }
        } catch {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

/**
 * High-level SMS router: attempts Twilio or Fast2SMS if configured, otherwise falls back to console log
 */
const sendRealSms = async (phone, code) => {
  const message = `Your CampConnect verification code is: ${code}. Valid for 10 minutes. Do not share this code.`;

  // 1. Try Twilio if credentials are provided in .env
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      console.log(`[SMS Gateway] Disagreeing via Twilio to ${phone}...`);
      await sendViaTwilio(phone, message);
      console.log(`[SMS Gateway] ✓ Real SMS successfully sent to ${phone} via Twilio!`);
      return { sent: true, provider: 'twilio' };
    } catch (err) {
      console.error(`[SMS Gateway] Twilio dispatch failed:`, err.message);
      return { sent: false, error: err.message, provider: 'twilio' };
    }
  }

  // 2. Try Fast2SMS if API key is provided in .env
  if (process.env.FAST2SMS_API_KEY) {
    try {
      console.log(`[SMS Gateway] Dispatching via Fast2SMS to ${phone}...`);
      await sendViaFast2Sms(phone, code);
      console.log(`[SMS Gateway] ✓ Real SMS successfully sent to ${phone} via Fast2SMS!`);
      return { sent: true, provider: 'fast2sms' };
    } catch (err) {
      console.error(`[SMS Gateway] Fast2SMS dispatch failed:`, err.message);
      return { sent: false, error: err.message, provider: 'fast2sms' };
    }
  }

  // 3. Fallback to development mode (logged to console)
  console.log(`[SMS Gateway] No SMS credentials in .env. Running in Development Mode. Code: ${code}`);
  return { sent: false, reason: 'no_gateway_configured' };
};

const issueOtp = async (phone) => {
  const now = Date.now();
  const existing = otpMemoryStore.get(phone);

  if (existing && existing.lastRequestedAt && (now - existing.lastRequestedAt < RESEND_COOLDOWN_SECONDS * 1000)) {
    const remainingSecs = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - (now - existing.lastRequestedAt)) / 1000);
    const err = new Error(`Please wait ${remainingSecs} seconds before requesting another code`);
    err.status = 429;
    throw err;
  }

  const code = generateCode();
  const expiresAt = now + OTP_TTL_MINUTES * 60 * 1000;

  otpMemoryStore.set(phone, {
    code,
    expiresAt,
    lastRequestedAt: now,
    attempts: 0,
    verified: false
  });

  console.log(`[OTP Verification] Phone: ${phone} -> Code: ${code} (Expires in ${OTP_TTL_MINUTES} mins)`);

  // Attempt real SMS dispatch
  const smsStatus = await sendRealSms(phone, code);

  return {
    code,
    sentViaSms: smsStatus.sent === true,
    provider: smsStatus.provider || null,
    error: smsStatus.error || null
  };
};

const checkOtp = async (phone, code) => {
  const record = otpMemoryStore.get(phone);
  if (!record) return false;

  if (Date.now() > record.expiresAt) {
    otpMemoryStore.delete(phone);
    return false;
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpMemoryStore.delete(phone);
    return false;
  }

  record.attempts += 1;

  if (String(code).trim() === record.code) {
    record.verified = true;
    return true;
  }

  return false;
};

const isPhoneVerified = (phone) => {
  const record = otpMemoryStore.get(phone);
  return record && record.verified === true;
};

const clearOtp = (phone) => {
  otpMemoryStore.delete(phone);
};

module.exports = {
  issueOtp,
  checkOtp,
  isPhoneVerified,
  clearOtp,
  sendRealSms
};

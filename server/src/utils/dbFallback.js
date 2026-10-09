/**
 * Helper to determine if an error is due to an offline, unreachable, or refused MySQL connection.
 */
const isDbOffline = (err) => {
  if (!err) return false;
  return (
    err.code === 'ECONNREFUSED' ||
    err.code === 'ETIMEDOUT' ||
    err.code === 'ENOTFOUND' ||
    err.code === 'PROTOCOL_CONNECTION_LOST' ||
    err.code === 'ER_ACCESS_DENIED_ERROR' ||
    (typeof err.message === 'string' && (
      err.message.includes('ECONNREFUSED') ||
      err.message.includes('connect ECONNREFUSED') ||
      err.message.includes('ETIMEDOUT') ||
      err.message.includes('getaddrinfo') ||
      err.message.includes('connection refused')
    ))
  );
};

module.exports = {
  isDbOffline
};

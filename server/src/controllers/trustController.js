const {
  calculateTicketTrustScore,
  evaluateTicketTrustScoreAsync,
  evaluateUserTrustProfile
} = require('../services/trustworthinessMLService');

const evaluateDraftTicket = async (req, res) => {
  try {
    const ticketData = {
      ...req.body,
      social_worker_id: req.user?.user_id || req.body?.social_worker_id
    };
    const analysis = await evaluateTicketTrustScoreAsync(ticketData);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error in evaluateDraftTicket:', error.message);
    try {
      const fallbackAnalysis = calculateTicketTrustScore(req.body);
      return res.json({
        success: true,
        analysis: fallbackAnalysis
      });
    } catch {
      res.status(500).json({
        success: false,
        message: 'Failed to evaluate ticket credibility'
      });
    }
  }
};

const getUserTrustProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await evaluateUserTrustProfile(id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error fetching user trust profile:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user trust profile'
    });
  }
};

module.exports = {
  evaluateDraftTicket,
  getUserTrustProfile
};

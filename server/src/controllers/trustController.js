const {
  calculateTicketTrustScore,
  evaluateUserTrustProfile
} = require('../services/trustworthinessMLService');

const evaluateDraftTicket = (req, res) => {
  try {
    const ticketData = req.body;
    const analysis = calculateTicketTrustScore(ticketData);

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error in evaluateDraftTicket:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate ticket trustworthiness'
    });
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

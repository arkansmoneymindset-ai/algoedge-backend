const express  = require('express');
const router   = express.Router();
const supabase = require('../utils/supabase');
const { sendContactAck, sendContactAdmin } = require('../utils/email');

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, enquiry, message,
            agreedToTerms, agreedToRisk, agreedToRefund } = req.body;

    // ── VALIDATION
    if (!firstName || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    // Legal checkboxes must be checked
    if (!agreedToTerms || !agreedToRisk || !agreedToRefund) {
      return res.status(400).json({ error: 'Please accept all terms before submitting.' });
    }

    const name = `${firstName} ${lastName || ''}`.trim();

    // ── SAVE TO DATABASE
    const { error: dbError } = await supabase
      .from('contacts')
      .insert({
        name,
        email: email.toLowerCase().trim(),
        phone: phone || null,
        enquiry: enquiry || null,
        message: message.trim(),
        agreed_to_terms: agreedToTerms,
        agreed_to_risk: agreedToRisk,
        agreed_to_refund: agreedToRefund,
        status: 'new',
        ip_address: req.ip
      });

    if (dbError) {
      console.error('DB error (contact):', dbError);
      return res.status(500).json({ error: 'Failed to save your message. Please try again.' });
    }

    // ── SEND EMAILS (non-blocking)
    Promise.all([
      sendContactAck(email, name),
      sendContactAdmin({ name, email, phone, enquiry, message })
    ]).catch(err => console.error('Email error:', err));

    return res.status(200).json({
      success: true,
      message: 'Your message has been received. We will reply within 24 hours.'
    });

  } catch (err) {
    console.error('Contact route error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

module.exports = router;

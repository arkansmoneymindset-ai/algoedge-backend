const express  = require('express');
const router   = express.Router();
const Razorpay = require('razorpay');
const supabase = require('../utils/supabase');
const { generateOrderId } = require('../utils/license');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Plan details
const PLANS = {
  starter: {
    name:     'Starter',
    price:    499900,    // ₹4,999 in paise
    accounts: 1,
    support:  '30 days'
  },
  professional: {
    name:     'Professional',
    price:    999900,    // ₹9,999 in paise
    accounts: 3,
    support:  '90 days'
  },
  enterprise: {
    name:     'Enterprise',
    price:    1999900,   // ₹19,999 in paise
    accounts: 999,
    support:  '1 year'
  }
};

// POST /api/orders/create
// Called when user clicks "Proceed to Payment" after accepting T&C
router.post('/create', async (req, res) => {
  try {
    const { plan, customerName, customerEmail, customerPhone,
            agreedToTerms, agreedToRisk, agreedToEula, agreedToAdult } = req.body;

    // ── VALIDATE
    if (!plan || !PLANS[plan.toLowerCase()]) {
      return res.status(400).json({ error: 'Invalid plan selected.' });
    }
    if (!customerEmail || !customerName) {
      return res.status(400).json({ error: 'Customer name and email are required.' });
    }
    // All 4 modal checkboxes must be true
    if (!agreedToTerms || !agreedToRisk || !agreedToEula || !agreedToAdult) {
      return res.status(400).json({ error: 'All agreements must be accepted before proceeding.' });
    }

    const planKey    = plan.toLowerCase();
    const planDetail = PLANS[planKey];
    const orderId    = generateOrderId();

    // ── CREATE RAZORPAY ORDER
    const rzpOrder = await razorpay.orders.create({
      amount:   planDetail.price,
      currency: 'INR',
      receipt:  orderId,
      notes: {
        plan:          planDetail.name,
        customer_name: customerName,
        customer_email: customerEmail
      }
    });

    // ── SAVE PENDING ORDER TO DB
    const { error: dbError } = await supabase
      .from('orders')
      .insert({
        order_id:         orderId,
        razorpay_order_id: rzpOrder.id,
        customer_name:    customerName,
        customer_email:   customerEmail.toLowerCase().trim(),
        customer_phone:   customerPhone || null,
        plan:             planDetail.name,
        amount:           planDetail.price,
        accounts_allowed: planDetail.accounts,
        support_duration: planDetail.support,
        status:           'pending',
        agreed_to_terms:  agreedToTerms,
        agreed_to_risk:   agreedToRisk,
        agreed_to_eula:   agreedToEula,
        agreed_to_adult:  agreedToAdult,
        ip_address:       req.ip
      });

    if (dbError) {
      console.error('DB error (order create):', dbError);
      return res.status(500).json({ error: 'Failed to create order. Please try again.' });
    }

    // ── RETURN RAZORPAY ORDER DETAILS TO FRONTEND
    return res.status(200).json({
      success: true,
      orderId,
      razorpayOrderId: rzpOrder.id,
      amount:          planDetail.price,
      currency:        'INR',
      planName:        planDetail.name,
      keyId:           process.env.RAZORPAY_KEY_ID
    });

  } catch (err) {
    console.error('Order create error:', err);
    return res.status(500).json({ error: 'Failed to create order. Please try again.' });
  }
});

// GET /api/orders/verify/:orderId
// Check order status (for frontend polling)
router.get('/verify/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select('order_id, status, plan, license_key, customer_name')
      .eq('order_id', orderId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    return res.json({
      orderId:    data.order_id,
      status:     data.status,
      plan:       data.plan,
      licenseKey: data.status === 'completed' ? data.license_key : null
    });

  } catch (err) {
    console.error('Order verify error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;

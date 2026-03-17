const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const supabase = require('../utils/supabase');
const { generateLicenseKey } = require('../utils/license');
const { sendLicenseDelivery, sendOrderAdmin } = require('../utils/email');

// POST /api/webhook/razorpay
// Razorpay calls this automatically after successful payment
router.post('/razorpay', async (req, res) => {
  try {
    // ── VERIFY SIGNATURE (security - don't skip this)
    const signature   = req.headers['x-razorpay-signature'];
    const rawBody     = req.body;   // raw buffer (express.raw middleware)
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSig) {
      console.warn('⚠️ Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event   = JSON.parse(rawBody.toString());
    const payload = event.payload;

    // ── ONLY HANDLE SUCCESSFUL PAYMENTS
    if (event.event !== 'payment.captured') {
      return res.status(200).json({ received: true });
    }

    const payment  = payload.payment.entity;
    const rzpOrderId = payment.order_id;
    const paymentId  = payment.id;
    const amount     = payment.amount;

    // ── FIND ORDER IN DB
    const { data: order, error: findErr } = await supabase
      .from('orders')
      .select('*')
      .eq('razorpay_order_id', rzpOrderId)
      .single();

    if (findErr || !order) {
      console.error('Order not found for Razorpay order:', rzpOrderId);
      return res.status(200).json({ received: true }); // still 200 to ack webhook
    }

    // ── SKIP IF ALREADY PROCESSED (idempotency)
    if (order.status === 'completed') {
      console.log('Order already processed:', order.order_id);
      return res.status(200).json({ received: true });
    }

    // ── GENERATE LICENSE KEY
    const licenseKey = generateLicenseKey();

    // ── UPDATE ORDER IN DB
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        status:      'completed',
        license_key: licenseKey,
        payment_id:  paymentId,
        paid_at:     new Date().toISOString()
      })
      .eq('razorpay_order_id', rzpOrderId);

    if (updateErr) {
      console.error('DB update error after payment:', updateErr);
      // Still try to send email even if DB update fails
    }

    // ── SAVE LICENSE TO licenses TABLE
    await supabase.from('licenses').insert({
      license_key:      licenseKey,
      order_id:         order.order_id,
      customer_email:   order.customer_email,
      plan:             order.plan,
      accounts_allowed: order.accounts_allowed,
      is_active:        true,
      activated_at:     new Date().toISOString()
    });

    // ── SEND LICENSE TO CUSTOMER
    await sendLicenseDelivery(order.customer_email, {
      customerName: order.customer_name,
      licenseKey,
      orderId:      order.order_id,
      plan:         order.plan,
      amount,
      paymentId
    });

    // ── NOTIFY ADMIN
    await sendOrderAdmin({
      orderId:       order.order_id,
      customerName:  order.customer_name,
      customerEmail: order.customer_email,
      plan:          order.plan,
      amount,
      licenseKey,
      paymentId
    });

    console.log(`✅ Order ${order.order_id} completed. License ${licenseKey} sent to ${order.customer_email}`);

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('Webhook error:', err);
    // Always return 200 to Razorpay to prevent retries on our errors
    return res.status(200).json({ received: true });
  }
});

module.exports = router;

const nodemailer = require('nodemailer');

// ── TRANSPORTER
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS   // Gmail App Password (not your real password)
  }
});

// ── VERIFY CONNECTION ON STARTUP
transporter.verify((err) => {
  if (err) console.error('❌ Email transporter error:', err.message);
  else     console.log('✅ Email transporter ready');
});

/* ════════════════════════════════════════
   EMAIL TEMPLATES
════════════════════════════════════════ */

// 1. Contact form acknowledgement → to customer
function contactAckTemplate(name) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#f4f7fe;padding:32px 20px;">
    <div style="background:#fff;border-radius:10px;padding:32px;border:1px solid #d4dcf0;">
      <div style="display:flex;align-items:center;margin-bottom:24px;">
        <div style="background:#1A3A8F;color:#fff;width:36px;height:36px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;margin-right:10px;">AE</div>
        <span style="font-weight:700;font-size:1.1rem;color:#0d1a35;">AlgoEdge</span>
      </div>
      <h2 style="color:#0d1a35;margin:0 0 12px;">Thanks for reaching out, ${name}!</h2>
      <p style="color:#4a6080;line-height:1.7;">We've received your message and will get back to you within <strong>24 hours</strong> on business days.</p>
      <p style="color:#4a6080;line-height:1.7;">In the meantime, feel free to check our <a href="${process.env.FRONTEND_URL}#faq" style="color:#2563EB;">FAQ section</a> — it answers most common questions.</p>
      <div style="margin-top:28px;padding:16px;background:#f4f7fe;border-radius:8px;border:1px solid #d4dcf0;">
        <p style="color:#4a6080;font-size:0.84rem;margin:0;line-height:1.6;"><strong>Legal reminder:</strong> AlgoEdge is a software automation tool. It is not investment advice and is not SEBI registered. Trading involves financial risk.</p>
      </div>
      <p style="color:#8098b8;font-size:0.82rem;margin-top:24px;">— AlgoEdge Support Team<br>support@algoedge.in</p>
    </div>
  </div>`;
}

// 2. Contact form notification → to admin
function contactAdminTemplate(data) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;">
    <h2 style="color:#0d1a35;">📬 New Contact Form Submission</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px;background:#f4f7fe;font-weight:600;width:130px;">Name</td><td style="padding:8px;border:1px solid #d4dcf0;">${data.name}</td></tr>
      <tr><td style="padding:8px;background:#f4f7fe;font-weight:600;">Email</td><td style="padding:8px;border:1px solid #d4dcf0;">${data.email}</td></tr>
      <tr><td style="padding:8px;background:#f4f7fe;font-weight:600;">Phone</td><td style="padding:8px;border:1px solid #d4dcf0;">${data.phone || '—'}</td></tr>
      <tr><td style="padding:8px;background:#f4f7fe;font-weight:600;">Enquiry</td><td style="padding:8px;border:1px solid #d4dcf0;">${data.enquiry || '—'}</td></tr>
      <tr><td style="padding:8px;background:#f4f7fe;font-weight:600;">Message</td><td style="padding:8px;border:1px solid #d4dcf0;">${data.message}</td></tr>
      <tr><td style="padding:8px;background:#f4f7fe;font-weight:600;">Time</td><td style="padding:8px;border:1px solid #d4dcf0;">${new Date().toLocaleString('en-IN')}</td></tr>
    </table>
  </div>`;
}

// 3. License delivery → to customer after payment
function licenseDeliveryTemplate(data) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#f4f7fe;padding:32px 20px;">
    <div style="background:#fff;border-radius:10px;padding:32px;border:1px solid #d4dcf0;">
      <div style="display:flex;align-items:center;margin-bottom:24px;">
        <div style="background:#1A3A8F;color:#fff;width:36px;height:36px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;margin-right:10px;">AE</div>
        <span style="font-weight:700;font-size:1.1rem;color:#0d1a35;">AlgoEdge</span>
      </div>
      <h2 style="color:#0d1a35;margin:0 0 8px;">Your License is Ready! ✅</h2>
      <p style="color:#4a6080;">Hi ${data.customerName}, your payment was confirmed. Here are your license details:</p>

      <div style="background:#0d1a35;border-radius:10px;padding:24px;margin:24px 0;text-align:center;">
        <p style="color:#8098b8;font-size:0.75rem;text-transform:uppercase;letter-spacing:.08em;margin:0 0 8px;">Your License Key</p>
        <p style="color:#60A5FA;font-family:monospace;font-size:1.4rem;font-weight:700;letter-spacing:.08em;margin:0;">${data.licenseKey}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:8px;background:#f4f7fe;font-weight:600;font-size:.85rem;width:130px;">Order ID</td><td style="padding:8px;border:1px solid #d4dcf0;font-size:.85rem;">${data.orderId}</td></tr>
        <tr><td style="padding:8px;background:#f4f7fe;font-weight:600;font-size:.85rem;">Plan</td><td style="padding:8px;border:1px solid #d4dcf0;font-size:.85rem;">${data.plan}</td></tr>
        <tr><td style="padding:8px;background:#f4f7fe;font-weight:600;font-size:.85rem;">Amount Paid</td><td style="padding:8px;border:1px solid #d4dcf0;font-size:.85rem;">₹${(data.amount/100).toLocaleString('en-IN')}</td></tr>
        <tr><td style="padding:8px;background:#f4f7fe;font-weight:600;font-size:.85rem;">Date</td><td style="padding:8px;border:1px solid #d4dcf0;font-size:.85rem;">${new Date().toLocaleDateString('en-IN')}</td></tr>
      </table>

      <h3 style="color:#0d1a35;margin:0 0 12px;">Next Steps:</h3>
      <ol style="color:#4a6080;line-height:2;padding-left:20px;">
        <li>Download the EA file — we will send it in a separate email within 2 hours</li>
        <li>Install it in your MT4/MT5 Experts folder</li>
        <li>Enter your license key when prompted</li>
        <li>Follow the setup guide attached in the next email</li>
      </ol>

      <div style="margin-top:24px;padding:16px;background:#FEF9EC;border-radius:8px;border:1px solid #FCD34D;">
        <p style="color:#92400E;font-size:0.84rem;margin:0;line-height:1.6;"><strong>⚠️ Important:</strong> This software is an automation tool only — not investment advice. Trading involves financial risk. You are responsible for all trading decisions. AlgoEdge is not SEBI registered.</p>
      </div>
      <p style="color:#8098b8;font-size:0.82rem;margin-top:24px;">Need help? Reply to this email or contact support@algoedge.in<br>— AlgoEdge Support Team</p>
    </div>
  </div>`;
}

// 4. New order notification → to admin
function orderAdminTemplate(data) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;">
    <h2 style="color:#16a34a;">💰 New Order Received!</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px;background:#f0fdf4;font-weight:600;width:140px;">Order ID</td><td style="padding:8px;border:1px solid #d4dcf0;">${data.orderId}</td></tr>
      <tr><td style="padding:8px;background:#f0fdf4;font-weight:600;">Customer</td><td style="padding:8px;border:1px solid #d4dcf0;">${data.customerName}</td></tr>
      <tr><td style="padding:8px;background:#f0fdf4;font-weight:600;">Email</td><td style="padding:8px;border:1px solid #d4dcf0;">${data.customerEmail}</td></tr>
      <tr><td style="padding:8px;background:#f0fdf4;font-weight:600;">Plan</td><td style="padding:8px;border:1px solid #d4dcf0;">${data.plan}</td></tr>
      <tr><td style="padding:8px;background:#f0fdf4;font-weight:600;">Amount</td><td style="padding:8px;border:1px solid #d4dcf0;font-weight:700;color:#16a34a;">₹${(data.amount/100).toLocaleString('en-IN')}</td></tr>
      <tr><td style="padding:8px;background:#f0fdf4;font-weight:600;">License Key</td><td style="padding:8px;border:1px solid #d4dcf0;font-family:monospace;">${data.licenseKey}</td></tr>
      <tr><td style="padding:8px;background:#f0fdf4;font-weight:600;">Payment ID</td><td style="padding:8px;border:1px solid #d4dcf0;">${data.paymentId}</td></tr>
    </table>
    <p style="color:#4a6080;margin-top:16px;">⚡ License has been auto-sent to the customer.</p>
  </div>`;
}

/* ════════════════════════════════════════
   SEND FUNCTIONS
════════════════════════════════════════ */

async function sendContactAck(to, name) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'We received your message — AlgoEdge',
    html: contactAckTemplate(name)
  });
}

async function sendContactAdmin(data) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `📬 New enquiry from ${data.name}`,
    html: contactAdminTemplate(data)
  });
}

async function sendLicenseDelivery(to, data) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Your AlgoEdge License Key — Order ${data.orderId}`,
    html: licenseDeliveryTemplate(data)
  });
}

async function sendOrderAdmin(data) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `💰 New Order: ${data.plan} — ₹${(data.amount/100).toLocaleString('en-IN')}`,
    html: orderAdminTemplate(data)
  });
}

module.exports = {
  sendContactAck,
  sendContactAdmin,
  sendLicenseDelivery,
  sendOrderAdmin
};

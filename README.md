# AlgoEdge Backend — Complete Setup Guide

## What This Backend Does

| Feature | Details |
|---|---|
| 📬 Contact Form | Saves to DB + sends email to you + acknowledgement to customer |
| 🛒 Order Creation | Creates Razorpay payment order when customer clicks Buy |
| ⚡ Auto License Delivery | Razorpay webhook → generates license key → emails customer instantly |
| 🔑 License Management | Track, activate, revoke licenses |
| 📊 Admin Dashboard | View all orders, contacts, revenue in one place |

---

## Step 1 — Install Node.js

Download from https://nodejs.org (LTS version)

---

## Step 2 — Setup Supabase (Free Database)

1. Go to https://supabase.com → Create free account
2. Click "New Project" → choose a name → set password → Create
3. Wait 2 minutes for project to start
4. Go to **SQL Editor** (left sidebar)
5. Copy entire content of `database.sql` → paste → click **Run**
6. Go to **Settings → API**
   - Copy **Project URL** → this is your `SUPABASE_URL`
   - Copy **service_role key** (secret) → this is your `SUPABASE_SERVICE_KEY`

---

## Step 3 — Setup Gmail App Password (for emails)

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (required)
3. Search "App passwords" → create one → select "Mail" + "Other (AlgoEdge)"
4. Copy the 16-character password → this is your `EMAIL_PASS`

---

## Step 4 — Setup Razorpay

1. Go to https://razorpay.com → Create account
2. Complete KYC (required for live payments)
3. Go to **Settings → API Keys** → Generate Key
   - Copy **Key ID** → `RAZORPAY_KEY_ID`
   - Copy **Key Secret** → `RAZORPAY_KEY_SECRET`
4. Go to **Settings → Webhooks** → Add webhook
   - URL: `https://your-backend-url.railway.app/api/webhook/razorpay`
   - Events: check `payment.captured`
   - Secret: create any strong password → `RAZORPAY_WEBHOOK_SECRET`

---

## Step 5 — Configure Environment

```bash
# In your project folder, copy the example file
cp .env.example .env

# Edit .env with your actual values
# Fill in all the values from steps 2-4
```

---

## Step 6 — Install & Run Locally

```bash
# Open terminal in the algoedge-backend folder

# Install packages
npm install

# Start server (development)
npm run dev

# You should see:
# ✅ AlgoEdge Backend running on port 3000
# ✅ Email transporter ready
```

---

## Step 7 — Connect Frontend to Backend

In your `AlgoEdge_Final.html`, add this before `</body>`:

```html
<script>
const BACKEND = 'https://your-backend-url.railway.app'; // your deployed URL

// When contact form submits
async function sendForm() {
  const payload = {
    firstName:      document.querySelector('[placeholder="Your name"]').value,
    email:          document.querySelector('[type=email]').value,
    phone:          document.querySelector('[type=tel]').value,
    message:        document.querySelector('textarea').value,
    agreedToTerms:  document.getElementById('t1').checked,
    agreedToRisk:   document.getElementById('t2').checked,
    agreedToRefund: document.getElementById('t3').checked,
  };
  const r = await fetch(BACKEND + '/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await r.json();
  if (data.success) showToast('✓ Message received. We will reply within 24 hours.');
  else showToast('❌ ' + data.error);
}

// When purchase button clicked — after T&C modal accepted
async function confirmPurchase() {
  closeModal();
  const planEl = document.getElementById('mPlan').textContent.toLowerCase();
  const r = await fetch(BACKEND + '/api/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan:            planEl,
      customerName:    'Customer',
      customerEmail:   'customer@email.com', // collect from form
      agreedToTerms:   true,
      agreedToRisk:    true,
      agreedToEula:    true,
      agreedToAdult:   true,
    })
  });
  const order = await r.json();
  if (!order.success) { showToast('❌ ' + order.error); return; }

  // Open Razorpay payment window
  const rzp = new Razorpay({
    key:         order.keyId,
    order_id:    order.razorpayOrderId,
    amount:      order.amount,
    currency:    'INR',
    name:        'AlgoEdge',
    description: order.planName + ' License',
    handler: function(response) {
      showToast('✅ Payment successful! Check your email for your license key.');
    }
  });
  rzp.open();
}
</script>
<!-- Add Razorpay SDK -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

## Step 8 — Deploy to Railway (Free Hosting)

1. Go to https://railway.app → Sign up with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Upload this folder to a GitHub repo first, then connect it
4. In Railway → **Variables** → add all your `.env` values
5. Railway auto-deploys. Copy your URL (e.g. `algoedge-backend.up.railway.app`)
6. Update `FRONTEND_URL` in .env to your Netlify site URL
7. Update Razorpay webhook URL to your Railway URL

---

## Step 9 — Admin Dashboard

1. Open `admin-dashboard.html` in browser
2. Change `const API = 'http://localhost:3000/api/admin'` to your Railway URL
3. Login with your `ADMIN_SECRET` from .env

---

## File Structure

```
algoedge-backend/
├── server.js              ← Main app entry
├── package.json
├── .env.example           ← Copy to .env and fill values
├── database.sql           ← Run this in Supabase SQL Editor
├── admin-dashboard.html   ← Your admin panel
├── routes/
│   ├── contact.js         ← Contact form handler
│   ├── orders.js          ← Create Razorpay orders
│   ├── webhook.js         ← Razorpay payment webhook
│   └── admin.js           ← Admin API routes
└── utils/
    ├── supabase.js        ← Database client
    ├── license.js         ← License key generator
    └── email.js           ← Email templates & sender
```

---

## Payment Flow (How It All Works)

```
Customer clicks Buy
      ↓
T&C Modal → All 4 boxes checked
      ↓
Frontend calls POST /api/orders/create
      ↓
Backend creates Razorpay order + saves to DB
      ↓
Frontend opens Razorpay payment window
      ↓
Customer pays
      ↓
Razorpay calls POST /api/webhook/razorpay
      ↓
Backend verifies signature
      ↓
License key generated
      ↓
DB updated → License email sent → Admin notified
```

---

## Support

Any issues → check console logs in Railway dashboard.
Common issue: Gmail blocks → make sure App Password is set correctly.

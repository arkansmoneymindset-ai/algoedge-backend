-- ═══════════════════════════════════════════════
--  AlgoEdge — Supabase Database Schema
--  Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════

-- ── CONTACTS TABLE
CREATE TABLE IF NOT EXISTS contacts (
  id               BIGSERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT,
  enquiry          TEXT,
  message          TEXT NOT NULL,
  agreed_to_terms  BOOLEAN DEFAULT FALSE,
  agreed_to_risk   BOOLEAN DEFAULT FALSE,
  agreed_to_refund BOOLEAN DEFAULT FALSE,
  status           TEXT DEFAULT 'new' CHECK (status IN ('new','read','replied')),
  ip_address       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id                 BIGSERIAL PRIMARY KEY,
  order_id           TEXT UNIQUE NOT NULL,
  razorpay_order_id  TEXT UNIQUE,
  customer_name      TEXT NOT NULL,
  customer_email     TEXT NOT NULL,
  customer_phone     TEXT,
  plan               TEXT NOT NULL,
  amount             BIGINT NOT NULL,        -- in paise
  accounts_allowed   INTEGER DEFAULT 1,
  support_duration   TEXT,
  status             TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  license_key        TEXT,
  payment_id         TEXT,
  agreed_to_terms    BOOLEAN DEFAULT FALSE,
  agreed_to_risk     BOOLEAN DEFAULT FALSE,
  agreed_to_eula     BOOLEAN DEFAULT FALSE,
  agreed_to_adult    BOOLEAN DEFAULT FALSE,
  ip_address         TEXT,
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── LICENSES TABLE
CREATE TABLE IF NOT EXISTS licenses (
  id               BIGSERIAL PRIMARY KEY,
  license_key      TEXT UNIQUE NOT NULL,
  order_id         TEXT REFERENCES orders(order_id),
  customer_email   TEXT NOT NULL,
  plan             TEXT NOT NULL,
  accounts_allowed INTEGER DEFAULT 1,
  is_active        BOOLEAN DEFAULT TRUE,
  mt_account       TEXT,                     -- customer's MT account number (optional)
  activated_at     TIMESTAMPTZ DEFAULT NOW(),
  revoked_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES for fast queries
CREATE INDEX IF NOT EXISTS idx_orders_email    ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_rzp      ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_licenses_email  ON licenses(customer_email);
CREATE INDEX IF NOT EXISTS idx_licenses_active ON licenses(is_active);

-- ── ROW LEVEL SECURITY (recommended for Supabase)
ALTER TABLE contacts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses  ENABLE ROW LEVEL SECURITY;

-- Service role key (used in backend) bypasses RLS automatically
-- No public read/write access needed

-- ── USEFUL VIEWS
CREATE OR REPLACE VIEW revenue_summary AS
SELECT
  plan,
  COUNT(*) AS total_orders,
  SUM(amount) / 100 AS total_revenue_inr,
  MIN(paid_at) AS first_sale,
  MAX(paid_at) AS last_sale
FROM orders
WHERE status = 'completed'
GROUP BY plan
ORDER BY total_revenue_inr DESC;

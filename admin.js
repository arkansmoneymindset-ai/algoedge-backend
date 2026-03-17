const express  = require('express');
const router   = express.Router();
const supabase = require('../utils/supabase');

// ── ADMIN AUTH MIDDLEWARE
function adminAuth(req, res, next) {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Apply auth to all admin routes
router.use(adminAuth);

// GET /api/admin/stats
// Dashboard summary numbers
router.get('/stats', async (req, res) => {
  try {
    const [orders, contacts, licenses] = await Promise.all([
      supabase.from('orders').select('status, amount, plan'),
      supabase.from('contacts').select('status'),
      supabase.from('licenses').select('is_active')
    ]);

    const allOrders    = orders.data || [];
    const completed    = allOrders.filter(o => o.status === 'completed');
    const totalRevenue = completed.reduce((sum, o) => sum + o.amount, 0);

    const planCounts = {};
    completed.forEach(o => { planCounts[o.plan] = (planCounts[o.plan] || 0) + 1; });

    return res.json({
      totalOrders:    allOrders.length,
      completedOrders: completed.length,
      pendingOrders:  allOrders.filter(o => o.status === 'pending').length,
      totalRevenue:   totalRevenue / 100,  // convert paise to rupees
      totalContacts:  (contacts.data || []).length,
      newContacts:    (contacts.data || []).filter(c => c.status === 'new').length,
      activeLicenses: (licenses.data || []).filter(l => l.is_active).length,
      planBreakdown:  planCounts
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// GET /api/admin/orders?page=1&limit=20&status=completed
router.get('/orders', async (req, res) => {
  try {
    const page   = parseInt(req.query.page)   || 1;
    const limit  = parseInt(req.query.limit)  || 20;
    const status = req.query.status || null;
    const from   = (page - 1) * limit;

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.json({ orders: data, total: count, page, limit });
  } catch (err) {
    console.error('Admin orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// GET /api/admin/contacts?page=1&status=new
router.get('/contacts', async (req, res) => {
  try {
    const page  = parseInt(req.query.page) || 1;
    const limit = 20;
    const from  = (page - 1) * limit;
    const status = req.query.status || null;

    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.json({ contacts: data, total: count, page });
  } catch (err) {
    console.error('Admin contacts error:', err);
    res.status(500).json({ error: 'Failed to fetch contacts.' });
  }
});

// PATCH /api/admin/contacts/:id/read
router.patch('/contacts/:id/read', async (req, res) => {
  try {
    const { error } = await supabase
      .from('contacts')
      .update({ status: 'read' })
      .eq('id', req.params.id);

    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update contact.' });
  }
});

// GET /api/admin/licenses
router.get('/licenses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('activated_at', { ascending: false });

    if (error) throw error;
    return res.json({ licenses: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch licenses.' });
  }
});

// PATCH /api/admin/licenses/:key/revoke
router.patch('/licenses/:key/revoke', async (req, res) => {
  try {
    const { error } = await supabase
      .from('licenses')
      .update({ is_active: false })
      .eq('license_key', req.params.key);

    if (error) throw error;
    return res.json({ success: true, message: 'License revoked.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke license.' });
  }
});

module.exports = router;

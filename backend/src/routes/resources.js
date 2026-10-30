const express = require('express');
const { getDb } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ---- Resources ----
const resourcesRouter = express.Router();
resourcesRouter.use(authenticateToken, requireRole('admin', 'staff'));

function formatResource(r) {
  if (!r) return null;
  return {
    id: r.id, name: r.name, category: r.category, quantity: r.quantity, unit: r.unit,
    lowStockThreshold: r.low_stock_threshold, dateAdded: r.date_added,
    expirationDate: r.expiration_date, description: r.description, status: r.status,
    createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

resourcesRouter.get('/', (req, res) => {
  try {
    const db = getDb();
    const { search, category, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = '1=1'; const params = [];
    if (search) { where += ' AND name LIKE ?'; params.push(`%${search}%`); }
    if (category) { where += ' AND category = ?'; params.push(category); }
    if (status) { where += ' AND status = ?'; params.push(status); }
    const total = db.prepare(`SELECT COUNT(*) as count FROM resources WHERE ${where}`).get(...params).count;
    const data = db.prepare(`SELECT * FROM resources WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
      .all(...params, parseInt(limit), offset).map(formatResource);
    res.json({ data, meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { res.status(500).json({ message: 'Internal server error.' }); }
});

resourcesRouter.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const r = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
    if (!r) return res.status(404).json({ message: 'Resource not found.' });
    res.json(formatResource(r));
  } catch (err) { res.status(500).json({ message: 'Internal server error.' }); }
});

resourcesRouter.post('/', (req, res) => {
  try {
    const { name, category, quantity, unit, lowStockThreshold, dateAdded, expirationDate, description, status } = req.body;
    if (!name || !category) return res.status(400).json({ message: 'Name and category required.' });
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO resources (name, category, quantity, unit, low_stock_threshold, date_added, expiration_date, description, status, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).run(name, category, quantity || 0, unit || 'pcs', lowStockThreshold || 10, dateAdded || new Date().toISOString().split('T')[0],
      expirationDate || null, description || null, status || 'available', req.user.id);
    const r = db.prepare('SELECT * FROM resources WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(formatResource(r));
  } catch (err) { res.status(500).json({ message: 'Internal server error.' }); }
});

resourcesRouter.patch('/:id', (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Resource not found.' });
    const { name, category, quantity, unit, lowStockThreshold, expirationDate, description, status } = req.body;
    const qty = quantity !== undefined ? Number(quantity) : existing.quantity;
    const thresh = lowStockThreshold !== undefined ? Number(lowStockThreshold) : existing.low_stock_threshold;
    let computedStatus = status || existing.status;
    if (!status && quantity !== undefined) {
      if (qty <= 0) computedStatus = 'out_of_stock';
      else if (qty <= thresh) computedStatus = 'low_stock';
      else computedStatus = 'available';
    }

    db.prepare('UPDATE resources SET name=?, category=?, quantity=?, unit=?, low_stock_threshold=?, expiration_date=?, description=?, status=?, updated_at=datetime(\'now\') WHERE id=?')
      .run(name || existing.name, category || existing.category, qty,
        unit || existing.unit, thresh,
        expirationDate !== undefined ? expirationDate : existing.expiration_date, description !== undefined ? description : existing.description,
        computedStatus, req.params.id);
    const r = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
    res.json(formatResource(r));
  } catch (err) { res.status(500).json({ message: 'Internal server error.' }); }
});

resourcesRouter.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM resources WHERE id = ?').run(req.params.id);
    res.json({ message: 'Resource deleted.' });
  } catch (err) { res.status(500).json({ message: 'Internal server error.' }); }
});

// ---- Distributions ----
const distributionsRouter = express.Router();
distributionsRouter.use(authenticateToken, requireRole('admin', 'staff'));

distributionsRouter.get('/', (req, res) => {
  try {
    const db = getDb();
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const total = db.prepare('SELECT COUNT(*) as count FROM resource_distributions').get().count;
    const data = db.prepare(`
      SELECT d.*, r.name as resource_name, r.unit as resource_unit,
        b.beneficiary_code, res.first_name as recipient_first, res.last_name as recipient_last
      FROM resource_distributions d
      LEFT JOIN resources r ON d.resource_id = r.id
      LEFT JOIN beneficiaries b ON d.beneficiary_id = b.id
      LEFT JOIN residents res ON b.resident_id = res.id
      ORDER BY d.distribution_date DESC LIMIT ? OFFSET ?
    `).all(parseInt(limit), offset).map(d => ({
      id: d.id, resourceId: d.resource_id, beneficiaryId: d.beneficiary_id,
      recipientName: d.recipient_name || (d.recipient_first ? `${d.recipient_first} ${d.recipient_last}` : null),
      quantity: d.quantity, distributionDate: d.distribution_date, purpose: d.purpose,
      notes: d.notes, distributedBy: d.distributed_by, createdAt: d.created_at,
      resource: { name: d.resource_name, unit: d.resource_unit },
    }));
    res.json({ data, meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { res.status(500).json({ message: 'Internal server error.' }); }
});

distributionsRouter.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const d = db.prepare('SELECT * FROM resource_distributions WHERE id = ?').get(req.params.id);
    if (!d) return res.status(404).json({ message: 'Distribution not found.' });
    res.json(d);
  } catch (err) { res.status(500).json({ message: 'Internal server error.' }); }
});

distributionsRouter.post('/', (req, res) => {
  try {
    const { resourceId, beneficiaryId, recipientName, quantity, distributionDate, purpose, notes } = req.body;
    const qty = parseInt(quantity, 10);

    if (!resourceId || isNaN(qty) || qty <= 0 || !distributionDate) {
      return res.status(400).json({ message: 'Resource ID, positive quantity, and distribution date are required.' });
    }

    const db = getDb();

    // 1. Check if resource exists
    const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    // 2. Validate sufficient inventory to prevent negative stock
    if (resource.quantity < qty) {
      return res.status(400).json({
        message: `Insufficient stock. Requested: ${qty} ${resource.unit || 'pcs'}, but only ${resource.quantity} ${resource.unit || 'pcs'} available.`
      });
    }

    // 3. Compute new quantity and status (available, low_stock, out_of_stock)
    const newQuantity = resource.quantity - qty;
    let newStatus = 'available';
    if (newQuantity === 0) {
      newStatus = 'out_of_stock';
    } else if (newQuantity <= (resource.low_stock_threshold || 10)) {
      newStatus = 'low_stock';
    }

    // 4. Execute distribution and stock update atomically in a database transaction
    let insertId;
    const executeDistribution = db.transaction(() => {
      const result = db.prepare(
        'INSERT INTO resource_distributions (resource_id, beneficiary_id, recipient_name, quantity, distribution_date, purpose, notes, distributed_by) VALUES (?,?,?,?,?,?,?,?)'
      ).run(resourceId, beneficiaryId || null, recipientName || null, qty, distributionDate, purpose || null, notes || null, req.user.id);
      insertId = result.lastInsertRowid;

      db.prepare(
        'UPDATE resources SET quantity = ?, status = ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).run(newQuantity, newStatus, resourceId);

      // Audit log entry
      db.prepare(
        'INSERT INTO audit_logs (user_id, user_name, action, module, record_id, details) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(
        req.user.id,
        req.user.email || 'Staff',
        'CREATE',
        'resources',
        resourceId,
        `Distributed ${qty} ${resource.unit || 'pcs'} of ${resource.name}. Remaining stock: ${newQuantity} (${newStatus})`
      );
    });

    executeDistribution();

    const d = db.prepare(`
      SELECT d.*, r.name as resource_name, r.unit as resource_unit,
        b.beneficiary_code, res.first_name as recipient_first, res.last_name as recipient_last
      FROM resource_distributions d
      LEFT JOIN resources r ON d.resource_id = r.id
      LEFT JOIN beneficiaries b ON d.beneficiary_id = b.id
      LEFT JOIN residents res ON b.resident_id = res.id
      WHERE d.id = ?
    `).get(insertId);

    res.status(201).json({
      id: d.id,
      resourceId: d.resource_id,
      beneficiaryId: d.beneficiary_id,
      recipientName: d.recipient_name || (d.recipient_first ? `${d.recipient_first} ${d.recipient_last}` : null),
      quantity: d.quantity,
      distributionDate: d.distribution_date,
      purpose: d.purpose,
      notes: d.notes,
      distributedBy: d.distributed_by,
      createdAt: d.created_at,
      resource: { name: d.resource_name, unit: d.resource_unit },
    });
  } catch (err) {
    console.error('[Distributions] Error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = { resourcesRouter, distributionsRouter };

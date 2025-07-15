const express = require('express');
const db = require('../db');
const { isAuthenticated, hasRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', isAuthenticated, hasRole(['customer', 'admin']), (req, res) => {
  const { description, urgency } = req.body;
  if (!description || !urgency) return res.status(400).json({ error: 'Missing fields' });
  const customer = req.session.user.name;
  const submission_date = new Date().toISOString();
  db.run('INSERT INTO workOrders (description, urgency, customer, submission_date, status) VALUES (?, ?, ?, ?, ?)', [description, urgency, customer, submission_date, 'Open'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

router.get('/', isAuthenticated, (req, res) => {
  db.all('SELECT * FROM workOrders', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.put('/:id', isAuthenticated, hasRole(['developer', 'admin']), (req, res) => {
  const { status } = req.body;
  const id = req.params.id;
  if (!status) return res.status(400).json({ error: 'Missing status' });
  db.run('UPDATE workOrders SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Work order not found' });
    res.json({ message: 'Updated' });
  });
});

module.exports = router; 
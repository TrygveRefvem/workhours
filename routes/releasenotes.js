const express = require('express');
const db = require('../db');
const { isAuthenticated, hasRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', isAuthenticated, hasRole(['developer', 'admin']), (req, res) => {
  const { work_order_id, problem, solution, next_steps } = req.body;
  if (!work_order_id || !problem || !solution || !next_steps) return res.status(400).json({ error: 'Missing fields' });
  const created_at = new Date().toISOString();
  db.get('SELECT id FROM workOrders WHERE id = ?', [work_order_id], (err, row) => {
    if (err || !row) return res.status(400).json({ error: 'Invalid work order' });
    db.run('INSERT INTO releaseNotes (work_order_id, problem, solution, next_steps, created_at) VALUES (?, ?, ?, ?, ?)', [work_order_id, problem, solution, next_steps, created_at], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    });
  });
});

router.get('/', isAuthenticated, (req, res) => {
  db.all('SELECT * FROM releaseNotes', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.put('/:id', isAuthenticated, hasRole(['developer', 'admin']), (req, res) => {
  const id = req.params.id;
  const { problem, solution, next_steps } = req.body;
  if (!problem && !solution && !next_steps) return res.status(400).json({ error: 'No fields to update' });
  db.run('UPDATE releaseNotes SET problem = COALESCE(?, problem), solution = COALESCE(?, solution), next_steps = COALESCE(?, next_steps) WHERE id = ?', [problem, solution, next_steps, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Updated' });
  });
});

module.exports = router; 
const express = require('express');
const db = require('../db');
const { isAuthenticated, hasRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', isAuthenticated, hasRole(['developer', 'admin']), (req, res) => {
  const { date, hours, minutes, work_order_id } = req.body;
  const user_id = req.session.user.id;
  if (!date || hours == null || minutes == null || !work_order_id) return res.status(400).json({ error: 'Missing fields' });
  if (hours < 0 || hours > 24 || minutes < 0 || minutes > 59) return res.status(400).json({ error: 'Invalid time' });
  db.get('SELECT id FROM workOrders WHERE id = ?', [work_order_id], (err, row) => {
    if (err || !row) return res.status(400).json({ error: 'Invalid work order' });
    db.run('INSERT INTO hoursWorked (user_id, date, hours, minutes, work_order_id) VALUES (?, ?, ?, ?, ?)', [user_id, date, hours, minutes, work_order_id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    });
  });
});

router.get('/', isAuthenticated, (req, res) => {
  db.all('SELECT h.*, u.name as worker FROM hoursWorked h JOIN users u ON h.user_id = u.id', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.put('/:id', isAuthenticated, (req, res) => {
  const id = req.params.id;
  const { date, hours, minutes, work_order_id } = req.body;
  db.get('SELECT user_id FROM hoursWorked WHERE id = ?', [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Not found' });
    if (row.user_id !== req.session.user.id && req.session.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    db.run('UPDATE hoursWorked SET date = COALESCE(?, date), hours = COALESCE(?, hours), minutes = COALESCE(?, minutes), work_order_id = COALESCE(?, work_order_id) WHERE id = ?', [date, hours, minutes, work_order_id, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Updated' });
    });
  });
});

router.delete('/:id', isAuthenticated, (req, res) => {
  const id = req.params.id;
  db.get('SELECT user_id FROM hoursWorked WHERE id = ?', [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Not found' });
    if (row.user_id !== req.session.user.id && req.session.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    db.run('DELETE FROM hoursWorked WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Deleted' });
    });
  });
});

router.get('/total/:work_order_id', isAuthenticated, (req, res) => {
  const work_order_id = req.params.work_order_id;
  db.all('SELECT hours, minutes FROM hoursWorked WHERE work_order_id = ?', [work_order_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    let totalH = 0, totalM = 0;
    rows.forEach((row) => {
      totalH += row.hours;
      totalM += row.minutes;
    });
    totalH += Math.floor(totalM / 60);
    totalM %= 60;
    res.json({ totalHours: totalH, totalMinutes: totalM });
  });
});

module.exports = router; 
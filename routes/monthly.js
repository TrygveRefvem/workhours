const express = require('express');
const db = require('../db');
const { isAuthenticated, hasRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', isAuthenticated, hasRole(['admin']), (req, res) => {
  db.all('SELECT * FROM monthlyAllocations', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/', isAuthenticated, hasRole(['admin']), (req, res) => {
  const { year, month, available_hours } = req.body;
  if (!year || !month || available_hours == null) return res.status(400).json({ error: 'Missing fields' });
  db.run('INSERT OR REPLACE INTO monthlyAllocations (year, month, available_hours) VALUES (?, ?, ?)', [year, month, available_hours], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

router.post('/transfer', isAuthenticated, hasRole(['admin']), (req, res) => {
  const { fromYear, fromMonth, toYear, toMonth, hours } = req.body;
  if (!fromYear || !fromMonth || !toYear || !toMonth || hours <= 0) return res.status(400).json({ error: 'Invalid transfer' });
  db.serialize(() => {
    db.get('SELECT available_hours FROM monthlyAllocations WHERE year = ? AND month = ?', [fromYear, fromMonth], (err, fromRow) => {
      if (err || !fromRow || fromRow.available_hours < hours) return res.status(400).json({ error: 'Insufficient hours' });
      db.run('UPDATE monthlyAllocations SET available_hours = available_hours - ? WHERE year = ? AND month = ?', [hours, fromYear, fromMonth]);
      db.run('INSERT OR REPLACE INTO monthlyAllocations (year, month, available_hours) VALUES (?, ?, COALESCE((SELECT available_hours FROM monthlyAllocations WHERE year = ? AND month = ?), 0) + ?)', [toYear, toMonth, toYear, toMonth, hours], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Transferred' });
      });
    });
  });
});

router.get('/worked/:year/:month', isAuthenticated, (req, res) => {
  const { year, month } = req.params;
  db.all(`SELECT SUM(hours + minutes / 60.0) as total FROM hoursWorked WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?`, [year, String(month).padStart(2, '0')], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ totalWorked: rows[0].total || 0 });
  });
});

module.exports = router; 
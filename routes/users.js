const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { isAuthenticated, hasRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', isAuthenticated, hasRole(['admin']), (req, res) => {
  const { name, role, password } = req.body;
  if (!name || !role || !password) return res.status(400).json({ error: 'Missing fields' });
  const password_hash = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (name, role, password_hash) VALUES (?, ?, ?)', [name, role, password_hash], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

router.get('/', isAuthenticated, hasRole(['admin']), (req, res) => {
  db.all('SELECT id, name, role FROM users', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router; 
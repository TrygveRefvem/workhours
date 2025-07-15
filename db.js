const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'workhours.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL, -- customer, developer, admin
      password_hash TEXT NOT NULL
    )`);

  db.run(`
    CREATE TABLE IF NOT EXISTS workOrders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      urgency TEXT NOT NULL,
      customer TEXT NOT NULL,
      status TEXT DEFAULT 'Open',
      submission_date TEXT NOT NULL
    )`);

  db.run(`
    CREATE TABLE IF NOT EXISTS hoursWorked (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      hours INTEGER NOT NULL,
      minutes INTEGER NOT NULL,
      work_order_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (work_order_id) REFERENCES workOrders (id)
    )`);

  db.run(`
    CREATE TABLE IF NOT EXISTS releaseNotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER NOT NULL,
      problem TEXT NOT NULL,
      solution TEXT NOT NULL,
      next_steps TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (work_order_id) REFERENCES workOrders (id)
    )`);

  db.run(`
    CREATE TABLE IF NOT EXISTS monthlyAllocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      available_hours REAL NOT NULL,
      UNIQUE(year, month)
    )`);
});

module.exports = db;

db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
  if (err || row.count > 0) return;
  const hash = bcrypt.hashSync('password', 10);
  db.run("INSERT INTO users (name, role, password_hash) VALUES ('admin', 'admin', ?)", [hash]);
  db.run("INSERT INTO users (name, role, password_hash) VALUES ('dev', 'developer', ?)", [hash]);
  db.run("INSERT INTO users (name, role, password_hash) VALUES ('cust', 'customer', ?)", [hash]);
}); 
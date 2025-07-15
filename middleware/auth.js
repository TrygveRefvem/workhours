const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  res.status(401).json({ error: 'Unauthorized' });
};

const hasRole = (roles) => (req, res, next) => {
  if (req.session.user && roles.includes(req.session.user.role)) return next();
  res.status(403).json({ error: 'Forbidden' });
};

module.exports = { isAuthenticated, hasRole }; 
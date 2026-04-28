const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const requireOwner = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Owner access required' });
  }
  next();
};

const requireCustomer = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ message: 'Customer access required' });
  }
  next();
};

module.exports = { authenticate, requireOwner, requireCustomer };

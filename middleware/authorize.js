// middleware/authorize.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret_key';

const authorize = (allowedRoles) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access token is missing' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: 'Invalid token' });

      req.user = user;

    //   Check role
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: 'You do not have permission to access this resource' });
      }

      next();
    });
  };
};

module.exports = authorize;

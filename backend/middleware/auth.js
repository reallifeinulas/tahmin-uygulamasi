const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.header('Authorization');
    
    if (!token) {
      return res.status(401).json({ message: 'Token bulunamadı' });
    }

    // Bearer token'ı kontrol et
    const bearerToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Geçersiz token' });
  }
}; 
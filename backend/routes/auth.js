const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const db = req.app.locals.db;

    // Validation
    const validationErrors = [];

    // Required fields kontrolü
    if (!username || username.trim().length === 0) {
      validationErrors.push('Kullanıcı adı gerekli');
    }
    if (!email || email.trim().length === 0) {
      validationErrors.push('E-posta adresi gerekli');
    }
    if (!password || password.length === 0) {
      validationErrors.push('Şifre gerekli');
    }

    // Format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email.trim())) {
      validationErrors.push('Geçerli bir e-posta adresi girin');
    }

    // Length kontrolü
    if (username && (username.trim().length < 3 || username.trim().length > 50)) {
      validationErrors.push('Kullanıcı adı 3-50 karakter arasında olmalıdır');
    }
    if (email && email.trim().length > 100) {
      validationErrors.push('E-posta adresi 100 karakterden uzun olamaz');
    }
    if (password && password.length < 6) {
      validationErrors.push('Şifre en az 6 karakter olmalıdır');
    }
    if (password && password.length > 128) {
      validationErrors.push('Şifre 128 karakterden uzun olamaz');
    }

    // Username format kontrolü (sadece alfanumerik ve underscore)
    const usernameRegex = /^[a-zA-Z0-9_üğıçöşıİĞÜÇÖŞ]+$/;
    if (username && !usernameRegex.test(username.trim())) {
      validationErrors.push('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir');
    }

    // Password strength kontrolü
    if (password) {
      if (!/[a-zA-Z]/.test(password)) {
        validationErrors.push('Şifre en az bir harf içermelidir');
      }
      if (!/[0-9]/.test(password)) {
        validationErrors.push('Şifre en az bir rakam içermelidir');
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation hatası', 
        errors: validationErrors 
      });
    }

    // Kullanıcı zaten var mı kontrol et (detaylı error messages)
    const [existingUsers] = await db.execute(
      'SELECT email, username FROM users WHERE email = ? OR username = ?',
      [email.trim().toLowerCase(), username.trim()]
    );

    const duplicateErrors = [];
    for (const existingUser of existingUsers) {
      if (existingUser.email === email.trim().toLowerCase()) {
        duplicateErrors.push('Bu email adresi zaten kullanılıyor');
      }
      if (existingUser.username === username.trim()) {
        duplicateErrors.push('Bu kullanıcı adı zaten kullanılıyor');
      }
    }

    if (duplicateErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Kayıt hatası', 
        errors: duplicateErrors 
      });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcıyı kaydet
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username.trim(), email.trim().toLowerCase(), hashedPassword]
    );

    const userId = result.insertId;

    // JWT token oluştur
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'Kayıt başarılı',
      user: { id: userId, username, email, role: 'user', points: 0, createdAt: new Date() },
      token
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = req.app.locals.db;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email ve şifre gerekli' });
    }

    // Kullanıcıyı bul (email normalize et)
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Email veya şifre hatalı' });
    }

    const user = users[0];

    // Şifreyi kontrol et
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Email veya şifre hatalı' });
    }

    // JWT token oluştur
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Giriş başarılı',
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role,
        points: user.points || 0,
        createdAt: user.created_at 
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 
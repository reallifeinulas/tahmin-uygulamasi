require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { startWeeklyResetCron } = require('./services/weeklyResetService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL bağlantısı
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Veritabanı bağlantısını test et
db.getConnection()
  .then(connection => {
    console.log('✅ MySQL bağlantısı başarılı');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL bağlantı hatası:', err.message);
  });

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend çalışıyor!', timestamp: new Date() });
});

// Veritabanı export et
app.locals.db = db;

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/awards', require('./routes/awards'));
app.use('/api/social', require('./routes/social'));

app.listen(PORT, () => {
  console.log(`🚀 Server http://localhost:${PORT} adresinde çalışıyor`);
  
  // Otomatik haftalık reset sistemi başlat
  startWeeklyResetCron(db);
  console.log('✅ Otomatik haftalık reset sistemi aktif!');
}); 
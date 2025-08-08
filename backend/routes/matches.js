const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Test endpoint - Database connection test
router.get('/test', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const [rows] = await db.execute('SELECT 1 as test');
    res.json({ 
      message: 'Database connection OK',
      result: rows[0] 
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Aktif maçları getir
router.get('/active', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const [matches] = await db.execute(
      'SELECT * FROM matches WHERE status = "active" ORDER BY match_date ASC'
    );

    res.json(matches);
  } catch (error) {
    console.error('Active matches error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm maçları getir
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const [matches] = await db.execute(
      'SELECT * FROM matches ORDER BY match_date DESC'
    );

    res.json(matches);
  } catch (error) {
    console.error('All matches error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Maç oluştur (Admin)
router.post('/',
  auth,
  [
    body('home_team').trim().notEmpty().withMessage('Ev sahibi takım adı gerekli').isLength({ max: 100 }).withMessage('Ev sahibi takım adı 100 karakterden uzun olamaz'),
    body('away_team').trim().notEmpty().withMessage('Deplasman takım adı gerekli').isLength({ max: 100 }).withMessage('Deplasman takım adı 100 karakterden uzun olamaz')
      .custom((value, { req }) => {
        if (value.toLowerCase() === req.body.home_team.toLowerCase()) {
          throw new Error('Bir takım kendisiyle oynayamaz');
        }
        return true;
      }),
    body('match_date').notEmpty().withMessage('Maç tarihi gerekli').isISO8601().withMessage('Geçersiz tarih formatı')
      .custom(value => {
        if (new Date(value) <= new Date()) {
          throw new Error('Maç tarihi gelecekte olmalıdır');
        }
        return true;
      }),
    body('league').trim().notEmpty().withMessage('Lig adı gerekli').isLength({ max: 100 }).withMessage('Lig adı 100 karakterden uzun olamaz'),
    body('home_points').optional().isInt({ min: 1, max: 10000 }).withMessage('Puanlar 1 ile 10000 arasında olmalıdır'),
    body('away_points').optional().isInt({ min: 1, max: 10000 }).withMessage('Puanlar 1 ile 10000 arasında olmalıdır'),
    body('draw_points').optional().isInt({ min: 1, max: 10000 }).withMessage('Puanlar 1 ile 10000 arasında olmalıdır'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { home_team, away_team, match_date, league, home_points, away_points, draw_points } = req.body;
      const db = req.app.locals.db;

      // Admin kontrolü
      const [adminUser] = await db.execute(
        'SELECT role FROM users WHERE id = ?',
        [req.userId]
      );

      if (adminUser.length === 0 || adminUser[0].role !== 'admin') {
        return res.status(403).json({ message: 'Yetkiniz bulunmamaktadır' });
      }

      const homePoints = parseInt(home_points) || 10;
      const awayPoints = parseInt(away_points) || 10;
      const drawPoints = parseInt(draw_points) || 15;

      const [result] = await db.execute(
        'INSERT INTO matches (home_team, away_team, match_date, league, home_points, away_points, draw_points) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [home_team.trim(), away_team.trim(), match_date, league.trim(), homePoints, awayPoints, drawPoints]
      );

      res.status(201).json({
        message: 'Maç oluşturuldu',
        matchId: result.insertId
      });
    } catch (error) {
      console.error('Create match error:', error);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  });

// Maç sonucu belirle (Admin)
router.put('/:id/result', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { result } = req.body;
    const db = req.app.locals.db;

    // Admin kontrolü
    const [adminUser] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [req.userId]
    );

    if (adminUser.length === 0 || adminUser[0].role !== 'admin') {
      return res.status(403).json({ message: 'Yetkiniz bulunmamaktadır' });
    }

    // Result değerini kontrol et
    if (!['home', 'away', 'draw'].includes(result)) {
      return res.status(400).json({ message: 'Geçersiz sonuç değeri' });
    }

    // Maç bilgilerini al
    const [match] = await db.execute(
      'SELECT * FROM matches WHERE id = ?',
      [id]
    );

    if (match.length === 0) {
      return res.status(404).json({ message: 'Maç bulunamadı' });
    }

    const matchData = match[0];
    
    // Kazanılacak puanı belirle
    let pointsToAward = 0;
    switch (result) {
      case 'home':
        pointsToAward = matchData.home_points;
        break;
      case 'away':
        pointsToAward = matchData.away_points;
        break;
      case 'draw':
        pointsToAward = matchData.draw_points;
        break;
    }

            // Connection al ve transaction başlat
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Maç sonucunu güncelle
      await connection.execute(
        'UPDATE matches SET result = ?, status = "completed" WHERE id = ?',
        [result, id]
      );

      // Doğru tahmin eden kullanıcıları bul ve puanlarını güncelle
      const [correctPredictions] = await connection.execute(
        'SELECT user_id FROM predictions WHERE match_id = ? AND selected_team = ?',
        [id, result]
      );

      if (correctPredictions.length > 0) {
        // Predictions tablosundaki puanları güncelle
        await connection.execute(
          'UPDATE predictions SET points = ? WHERE match_id = ? AND selected_team = ?',
          [pointsToAward, id, result]
        );

        // Kullanıcıların toplam puanlarını güncelle
        for (const prediction of correctPredictions) {
          await connection.execute(
            'UPDATE users SET points = points + ? WHERE id = ?',
            [pointsToAward, prediction.user_id]
          );
        }
      }

      // Yanlış tahmin edenlerin puanlarını 0 yap
      await connection.execute(
        'UPDATE predictions SET points = 0 WHERE match_id = ? AND selected_team != ?',
        [id, result]
      );

      await connection.commit();
      connection.release();

      res.json({ 
        message: 'Maç sonucu başarıyla güncellendi',
        correctPredictions: correctPredictions.length,
        pointsAwarded: pointsToAward
      });
    } catch (error) {
      console.error('Transaction error in match result:', error);
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Update match result error:', error);
    res.status(500).json({ 
      message: 'Sunucu hatası', 
      error: error.message 
    });
  }
});

// Maç sil (Admin)
router.delete('/:id', auth, async (req, res) => {
try {
  const { id } = req.params;
  const db = req.app.locals.db;

  // Admin kontrolü
  const [adminUser] = await db.execute(
    'SELECT role FROM users WHERE id = ?',
    [req.userId]
  );

  if (adminUser.length === 0 || adminUser[0].role !== 'admin') {
    return res.status(403).json({ message: 'Yetkiniz bulunmamaktadır' });
  }

  // Maç var mı kontrol et
  const [match] = await db.execute(
    'SELECT * FROM matches WHERE id = ?',
    [id]
  );

  if (match.length === 0) {
    return res.status(404).json({ message: 'Maç bulunamadı' });
  }

  // Connection al ve transaction başlat
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Önce o maça ait tahminleri sil
    await connection.execute(
      'DELETE FROM predictions WHERE match_id = ?',
      [id]
    );

    // Sonra maçı sil
    await connection.execute(
      'DELETE FROM matches WHERE id = ?',
      [id]
    );

    await connection.commit();
    connection.release();

    res.json({ message: 'Maç başarıyla silindi' });
  } catch (error) {
    console.error('Transaction error in delete match:', error);
    await connection.rollback();
    connection.release();
    throw error;
  }
} catch (error) {
  console.error('Delete match error:', error);
  res.status(500).json({ 
    message: 'Sunucu hatası', 
    error: error.message 
  });
}
});

module.exports = router; 
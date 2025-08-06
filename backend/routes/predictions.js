const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Tahmin yap
router.post('/', auth, async (req, res) => {
  try {
    const { match_id, selected_team } = req.body;
    const db = req.app.locals.db;

    // selected_team değerini kontrol et
    if (!['home', 'away', 'draw'].includes(selected_team)) {
      return res.status(400).json({ message: 'Geçersiz tahmin seçimi' });
    }

    // Maçın aktif olup olmadığını kontrol et
    const [matches] = await db.execute(
      'SELECT * FROM matches WHERE id = ? AND status = "active"',
      [match_id]
    );

    if (matches.length === 0) {
      return res.status(400).json({ message: 'Bu maça tahmin yapılamaz' });
    }

    const match = matches[0];
    
    // Deadline kontrolü: Maç başlamadan 10 dakika önce tahmin kapanır
    const matchDate = new Date(match.match_date);
    const now = new Date();
    const deadlineTime = new Date(matchDate.getTime() - 10 * 60 * 1000); // 10 dakika önce
    
    if (now > deadlineTime) {
      return res.status(400).json({ 
        message: 'Tahmin süresi doldu. Maç başlamadan 10 dakika önce tahminler kapanır.',
        deadline_passed: true 
      });
    }

    // Daha önce tahmin yapılmış mı kontrol et
    const [existingPrediction] = await db.execute(
      'SELECT * FROM predictions WHERE user_id = ? AND match_id = ?',
      [req.userId, match_id]
    );

    if (existingPrediction.length > 0) {
      // Güncelle
      await db.execute(
        'UPDATE predictions SET selected_team = ? WHERE user_id = ? AND match_id = ?',
        [selected_team, req.userId, match_id]
      );
    } else {
      // Yeni tahmin
      await db.execute(
        'INSERT INTO predictions (user_id, match_id, selected_team) VALUES (?, ?, ?)',
        [req.userId, match_id, selected_team]
      );
    }

    res.json({ message: 'Tahmin kaydedildi' });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcının tahminlerini getir
router.get('/my', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;

    const [predictions] = await db.execute(`
      SELECT 
        p.id, p.match_id, p.selected_team, p.created_at,
        m.home_team, m.away_team, m.match_date, m.status, m.result,
        m.home_points, m.away_points, m.draw_points,
        CASE 
          WHEN m.status = 'completed' AND m.result IS NOT NULL THEN
            CASE 
              WHEN p.selected_team = m.result THEN 1 
              ELSE 0 
            END
          ELSE NULL
        END as is_correct,
        CASE 
          WHEN m.status = 'completed' AND m.result IS NOT NULL AND p.selected_team = m.result THEN
            CASE 
              WHEN p.selected_team = 'home' THEN m.home_points
              WHEN p.selected_team = 'away' THEN m.away_points
              WHEN p.selected_team = 'draw' THEN m.draw_points
              ELSE 0
            END
          ELSE 0
        END as points_earned
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      WHERE p.user_id = ?
      ORDER BY m.match_date DESC
    `, [req.userId]);

    res.json({ success: true, data: predictions });
  } catch (error) {
    console.error('Get user predictions error:', error);
    res.status(500).json({ success: false, error: 'Tahmin geçmişi yüklenirken hata oluştu' });
  }
});

// Belirli kullanıcının tahmin geçmişini getir (username ile)
router.get('/user/:username', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { username } = req.params;

    // Kullanıcı var mı kontrol et ve ID'sini al
    const [userCheck] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
    }

    const userId = userCheck[0].id;

    // Sadece tamamlanmış maçlardaki tahminleri getir
    const [predictions] = await db.execute(`
      SELECT 
        p.id, p.match_id, p.selected_team, p.created_at,
        m.home_team, m.away_team, m.match_date, m.status, m.result,
        m.home_points, m.away_points, m.draw_points,
        CASE 
          WHEN p.selected_team = m.result THEN 1 
          ELSE 0 
        END as is_correct,
        CASE 
          WHEN p.selected_team = m.result THEN
            CASE 
              WHEN p.selected_team = 'home' THEN m.home_points
              WHEN p.selected_team = 'away' THEN m.away_points
              WHEN p.selected_team = 'draw' THEN m.draw_points
              ELSE 0
            END
          ELSE 0
        END as points_earned
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      WHERE p.user_id = ? AND m.status = 'completed' AND m.result IS NOT NULL
      ORDER BY m.match_date DESC
    `, [userId]);

    res.json({ success: true, data: predictions });
  } catch (error) {
    console.error('Get user predictions error:', error);
    res.status(500).json({ success: false, error: 'Tahmin geçmişi yüklenirken hata oluştu' });
  }
});

module.exports = router; 
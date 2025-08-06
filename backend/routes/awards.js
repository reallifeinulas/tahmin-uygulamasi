const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getWeeksAgo, formatWeekRange } = require('../utils/weekUtils');
const { testWeeklyReset } = require('../services/weeklyResetService');

// Haftalık sıralamaları getir
router.get('/weekly-rankings', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;

    // Admin kontrolü
    const [adminUser] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [req.userId]
    );

    if (adminUser.length === 0 || adminUser[0].role !== 'admin') {
      return res.status(403).json({ message: 'Yetkiniz bulunmamaktadır' });
    }

    // Son 8 haftanın sıralamalarını hesapla (Salı 03:00 - Salı 02:59)
    const weeks = [];
    
    for (let i = 0; i < 8; i++) {
      const weekData = getWeeksAgo(i);
      const weekStart = weekData.start;
      const weekEnd = weekData.end;

      // Bu hafta içinde tamamlanan maçlardan kazanılan puanları hesapla
      const [weeklyRanking] = await db.execute(`
        SELECT 
          u.id,
          u.username,
          u.email,
          COALESCE(SUM(
            CASE 
              WHEN p.selected_team = 'home' AND m.result = 'home' THEN m.home_points
              WHEN p.selected_team = 'away' AND m.result = 'away' THEN m.away_points
              WHEN p.selected_team = 'draw' AND m.result = 'draw' THEN m.draw_points
              ELSE 0
            END
          ), 0) as weekly_points,
          COUNT(p.id) as predictions_count,
          COUNT(CASE 
            WHEN (p.selected_team = 'home' AND m.result = 'home') OR
                 (p.selected_team = 'away' AND m.result = 'away') OR
                 (p.selected_team = 'draw' AND m.result = 'draw') THEN 1 
          END) as correct_predictions
        FROM users u
        LEFT JOIN predictions p ON u.id = p.user_id
        LEFT JOIN matches m ON p.match_id = m.id 
        WHERE u.role = 'user' AND (
          m.id IS NULL OR 
          (m.status = 'completed' AND m.match_date BETWEEN ? AND ?)
        )
        GROUP BY u.id, u.username, u.email
        HAVING predictions_count > 0 OR u.id = u.id
        ORDER BY weekly_points DESC, correct_predictions DESC
        LIMIT 10
      `, [weekStart, weekEnd]);

      // Bu hafta için verilen ödülleri kontrol et
      const [existingAwards] = await db.execute(
        'SELECT user_id, position FROM awards WHERE week_start = ?',
        [weekStart.toISOString().split('T')[0]]
      );

      weeks.push({
        week_start: weekStart.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0],
        week_label: formatWeekRange(weekStart, weekEnd),
        rankings: weeklyRanking.map((user, index) => ({
          ...user,
          position: index + 1,
          has_award: existingAwards.some(award => award.user_id === user.id && award.position === index + 1)
        }))
      });
    }

    res.json(weeks);
  } catch (error) {
    console.error('Weekly rankings error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Ödül ver
router.post('/give-award', auth, async (req, res) => {
  try {
    const { user_id, week_start, week_end, position, reward_code, description } = req.body;
    const db = req.app.locals.db;

    // Admin kontrolü
    const [adminUser] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [req.userId]
    );

    if (adminUser.length === 0 || adminUser[0].role !== 'admin') {
      return res.status(403).json({ message: 'Yetkiniz bulunmamaktadır' });
    }

    // Ödül kodu zorunlu kontrol
    if (!reward_code || !reward_code.trim()) {
      return res.status(400).json({ message: 'Ödül kodu zorunludur' });
    }

    // Ödül kaydet (sadece ödül kodu ve açıklama - puan eklenmez)
    await db.execute(`
      INSERT INTO awards (user_id, week_start, week_end, position, reward_code, description, awarded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        reward_code = VALUES(reward_code),
        description = VALUES(description),
        awarded_by = VALUES(awarded_by)
    `, [user_id, week_start, week_end, position, reward_code.trim(), description, req.userId]);

    res.json({ 
      message: 'Ödül başarıyla verildi', 
      reward_code: reward_code.trim(),
      user_id: user_id,
      position: position
    });
  } catch (error) {
    console.error('Give award error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcının ödüllerini getir
router.get('/my-awards', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const [awards] = await db.execute(`
      SELECT 
        a.*,
        u.username as awarded_by_name
      FROM awards a
      LEFT JOIN users u ON a.awarded_by = u.id
      WHERE a.user_id = ?
      ORDER BY a.week_start DESC
    `, [req.userId]);

    res.json(awards);
  } catch (error) {
    console.error('My awards error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm ödülleri getir (Admin)
router.get('/all', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;

    // Admin kontrolü
    const [adminUser] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [req.userId]
    );

    if (adminUser.length === 0 || adminUser[0].role !== 'admin') {
      return res.status(403).json({ message: 'Yetkiniz bulunmamaktadır' });
    }

    const [awards] = await db.execute(`
      SELECT 
        a.*,
        u.username,
        u.email,
        admin_user.username as awarded_by_name
      FROM awards a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN users admin_user ON a.awarded_by = admin_user.id
      ORDER BY a.week_start DESC, a.position ASC
    `);

    res.json(awards);
  } catch (error) {
    console.error('All awards error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// TEST ENDPOINT - Sadece development için
router.post('/test-reset', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;

    // Admin kontrolü
    const [adminUser] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [req.userId]
    );

    if (adminUser.length === 0 || adminUser[0].role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Yetkiniz bulunmamaktadır' });
    }

    console.log('🧪 TEST: Manuel haftalık reset başlatılıyor (Admin tarafından)...');
    const result = await testWeeklyReset(db);

    res.json(result);
  } catch (error) {
    console.error('Test reset error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Test reset işlemi başarısız',
      error: error.message 
    });
  }
});

module.exports = router; 
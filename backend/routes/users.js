const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getCurrentWeek } = require('../utils/weekUtils');

// Kullanıcı profili
router.get('/profile', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const [users] = await db.execute(
      'SELECT id, username, email, points, role, created_at FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Kullanıcı bulunamadı' 
      });
    }

    res.json({ 
      success: true, 
      data: users[0] 
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Sunucu hatası' 
    });
  }
});

// Belirli bir kullanıcının profilini getir (username ile)
router.get('/profile/:username', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { username } = req.params;

    // Kullanıcı bilgilerini getir
    const [users] = await db.execute(
      'SELECT id, username, email, points, created_at FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı istatistikleri (kendi profili için)
router.get('/stats', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Toplam tahmin sayısı
    const [totalPredictions] = await db.execute(
      'SELECT COUNT(*) as total FROM predictions WHERE user_id = ?',
      [req.userId]
    );

    // Doğru tahmin sayısı ve kazanılan puan
    const [correctPredictions] = await db.execute(`
      SELECT 
        COUNT(*) as correct_count,
        COALESCE(SUM(
          CASE 
            WHEN p.selected_team = 'home' AND m.result = 'home' THEN m.home_points
            WHEN p.selected_team = 'away' AND m.result = 'away' THEN m.away_points
            WHEN p.selected_team = 'draw' AND m.result = 'draw' THEN m.draw_points
            ELSE 0
          END
        ), 0) as points_earned
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      WHERE p.user_id = ? AND m.status = 'completed' AND m.result IS NOT NULL
      AND (
        (p.selected_team = 'home' AND m.result = 'home') OR
        (p.selected_team = 'away' AND m.result = 'away') OR
        (p.selected_team = 'draw' AND m.result = 'draw')
      )
    `, [req.userId]);

    // Tahmin dağılımı
    const [predictionDistribution] = await db.execute(`
      SELECT 
        selected_team,
        COUNT(*) as count
      FROM predictions 
      WHERE user_id = ?
      GROUP BY selected_team
    `, [req.userId]);

    // Tamamlanmış maçlardaki toplam tahmin sayısı (başarı oranı için)
    const [completedPredictions] = await db.execute(`
      SELECT COUNT(*) as completed_total
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      WHERE p.user_id = ? AND m.status = 'completed'
    `, [req.userId]);

    const stats = {
      total_predictions: totalPredictions[0].total,
      correct_predictions: correctPredictions[0].correct_count,
      completed_predictions: completedPredictions[0].completed_total,
      success_rate: completedPredictions[0].completed_total > 0 
        ? Math.round((correctPredictions[0].correct_count / completedPredictions[0].completed_total) * 100)
        : 0,
      points_earned: correctPredictions[0].points_earned,
      prediction_distribution: predictionDistribution.reduce((acc, item) => {
        acc[item.selected_team] = item.count;
        return acc;
      }, { home: 0, away: 0, draw: 0 })
    };

    res.json(stats);
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Belirli kullanıcının istatistiklerini getir (username ile)
router.get('/stats/:username', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { username } = req.params;

    // Kullanıcı var mı kontrol et ve ID'sini al
    const [userCheck] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const userId = userCheck[0].id;
    
    // Toplam tahmin sayısı
    const [totalPredictions] = await db.execute(
      'SELECT COUNT(*) as total FROM predictions WHERE user_id = ?',
      [userId]
    );

    // Doğru tahmin sayısı ve kazanılan puan
    const [correctPredictions] = await db.execute(`
      SELECT 
        COUNT(*) as correct_count,
        COALESCE(SUM(
          CASE 
            WHEN p.selected_team = 'home' AND m.result = 'home' THEN m.home_points
            WHEN p.selected_team = 'away' AND m.result = 'away' THEN m.away_points
            WHEN p.selected_team = 'draw' AND m.result = 'draw' THEN m.draw_points
            ELSE 0
          END
        ), 0) as points_earned
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      WHERE p.user_id = ? AND m.status = 'completed' AND m.result IS NOT NULL
      AND (
        (p.selected_team = 'home' AND m.result = 'home') OR
        (p.selected_team = 'away' AND m.result = 'away') OR
        (p.selected_team = 'draw' AND m.result = 'draw')
      )
    `, [userId]);

    // Tahmin dağılımı
    const [predictionDistribution] = await db.execute(`
      SELECT 
        selected_team,
        COUNT(*) as count
      FROM predictions 
      WHERE user_id = ?
      GROUP BY selected_team
    `, [userId]);

    // Tamamlanmış maçlardaki toplam tahmin sayısı (başarı oranı için)
    const [completedPredictions] = await db.execute(`
      SELECT COUNT(*) as completed_total
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      WHERE p.user_id = ? AND m.status = 'completed'
    `, [userId]);

    const stats = {
      total_predictions: totalPredictions[0].total,
      correct_predictions: correctPredictions[0].correct_count,
      completed_predictions: completedPredictions[0].completed_total,
      success_rate: completedPredictions[0].completed_total > 0 
        ? Math.round((correctPredictions[0].correct_count / completedPredictions[0].completed_total) * 100)
        : 0,
      points_earned: correctPredictions[0].points_earned,
      prediction_distribution: predictionDistribution.reduce((acc, item) => {
        acc[item.selected_team] = item.count;
        return acc;
      }, { home: 0, away: 0, draw: 0 })
    };

    res.json(stats);
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Haftalık kullanıcı sıralaması (Salı 03:00 - Salı 02:59)
router.get('/leaderboard', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Şu anki hafta tarihlerini al
    const currentWeek = getCurrentWeek();
    
    // Bu hafta içinde tamamlanan maçlardan kazanılan puanları hesapla
    const [users] = await db.execute(`
      SELECT 
        u.id,
        u.username,
        COALESCE(SUM(
          CASE 
            WHEN p.selected_team = 'home' AND m.result = 'home' THEN m.home_points
            WHEN p.selected_team = 'away' AND m.result = 'away' THEN m.away_points
            WHEN p.selected_team = 'draw' AND m.result = 'draw' THEN m.draw_points
            ELSE 0
          END
        ), 0) as points,
        COUNT(p.id) as predictions_count,
        COUNT(CASE 
          WHEN (p.selected_team = 'home' AND m.result = 'home') OR
               (p.selected_team = 'away' AND m.result = 'away') OR
               (p.selected_team = 'draw' AND m.result = 'draw') THEN 1 
        END) as correct_predictions
      FROM users u
      LEFT JOIN predictions p ON u.id = p.user_id
      LEFT JOIN matches m ON p.match_id = m.id 
      WHERE (
        m.id IS NULL OR 
        (m.status = 'completed' AND m.match_date BETWEEN ? AND ?)
      )
      GROUP BY u.id, u.username
      ORDER BY points DESC, correct_predictions DESC
      LIMIT 10
    `, [currentWeek.start, currentWeek.end]);

    res.json(users);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm kullanıcıları listele (Admin)
router.get('/', auth, async (req, res) => {
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

    // Tüm kullanıcıları getir
    const [users] = await db.execute(
      'SELECT id, username, email, role, points, created_at FROM users ORDER BY created_at DESC'
    );

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı sil (Admin)
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

    // Silinecek kullanıcı var mı kontrol et
    const [targetUser] = await db.execute(
      'SELECT id, username, role FROM users WHERE id = ?',
      [id]
    );

    if (targetUser.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Kendini silmeye çalışıyor mu?
    if (parseInt(id) === req.userId) {
      return res.status(400).json({ message: 'Kendi hesabınızı silemezsiniz' });
    }

    // Admin başka admin'i silmeye çalışıyor mu?
    if (targetUser[0].role === 'admin') {
      return res.status(400).json({ message: 'Admin kullanıcıları silinemez' });
    }

    // Connection al ve transaction başlat
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Önce kullanıcının tahminlerini sil
      await connection.execute(
        'DELETE FROM predictions WHERE user_id = ?',
        [id]
      );

      // Kullanıcının ödüllerini sil
      await connection.execute(
        'DELETE FROM awards WHERE user_id = ?',
        [id]
      );

      // Kullanıcıyı sil
      await connection.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );

      await connection.commit();
      connection.release();

      res.json({ 
        message: `Kullanıcı "${targetUser[0].username}" başarıyla silindi`,
        deletedUser: {
          id: targetUser[0].id,
          username: targetUser[0].username
        }
      });

    } catch (error) {
      console.error('Transaction error in user deletion:', error);
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      message: 'Sunucu hatası', 
      error: error.message 
    });
  }
});

module.exports = router; 
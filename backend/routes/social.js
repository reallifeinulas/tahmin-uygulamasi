const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');


// Profil yorumu ekle
router.post('/profile/:username/comments', auth, async (req, res) => {
  try {
    const { username } = req.params;
    const { comment_text } = req.body;
    const commenterUserId = req.userId;
    const db = req.app.locals.db;

    // Validation
    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Yorum boş olamaz' });
    }

    if (comment_text.trim().length > 500) {
      return res.status(400).json({ success: false, error: 'Yorum 500 karakterden uzun olamaz' });
    }

    // Profil sahibini bul
    const [profileUser] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (profileUser.length === 0) {
      return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
    }

    const profileUserId = profileUser[0].id;

    // Yorumu kaydet
    const [result] = await db.execute(
      'INSERT INTO profile_comments (commenter_user_id, profile_user_id, comment_text) VALUES (?, ?, ?)',
      [commenterUserId, profileUserId, comment_text.trim()]
    );

    // Eklenen yorumu döndür
    const [newComment] = await db.execute(`
      SELECT 
        pc.id,
        pc.comment_text,
        pc.created_at,
        u.username as commenter_username
      FROM profile_comments pc
      JOIN users u ON pc.commenter_user_id = u.id
      WHERE pc.id = ?
    `, [result.insertId]);

    res.json({ success: true, data: newComment[0], message: 'Yorum başarıyla eklendi' });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// Profil yorumlarını listele
router.get('/profile/:username/comments', async (req, res) => {
  try {
    const { username } = req.params;
    const db = req.app.locals.db;

    // Kullanıcıyı bul
    const [targetUser] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (targetUser.length === 0) {
      return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });
    }

    const userId = targetUser[0].id;

    // Yorumları getir (silinen hariç)
    const [comments] = await db.execute(`
      SELECT 
        pc.id,
        pc.comment_text,
        pc.created_at,
        pc.updated_at,
        u.id as commenter_id,
        u.username as commenter_username
      FROM profile_comments pc
      JOIN users u ON pc.commenter_user_id = u.id
      WHERE pc.profile_user_id = ? AND pc.is_deleted = FALSE
      ORDER BY pc.created_at DESC
      LIMIT 50
    `, [userId]);

    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

// Yorum sil (sadece kendi yorumunu)
router.delete('/comments/:commentId', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.userId;
    const db = req.app.locals.db;

    // Yorum var mı ve sahibi mi kontrol et
    const [comment] = await db.execute(
      'SELECT commenter_user_id FROM profile_comments WHERE id = ? AND is_deleted = FALSE',
      [commentId]
    );

    if (comment.length === 0) {
      return res.status(404).json({ success: false, error: 'Yorum bulunamadı' });
    }

    if (comment[0].commenter_user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Sadece kendi yorumlarınızı silebilirsiniz' });
    }

    // Soft delete
    await db.execute(
      'UPDATE profile_comments SET is_deleted = TRUE WHERE id = ?',
      [commentId]
    );

    res.json({ success: true, message: 'Yorum silindi' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
});

module.exports = router; 
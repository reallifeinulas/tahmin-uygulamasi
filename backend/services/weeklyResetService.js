const cron = require('node-cron');
const { getWeeksAgo, formatWeekRange } = require('../utils/weekUtils');

/**
 * Otomatik haftalık reset işlemi
 * Her Salı 03:00'da çalışır
 */
async function performWeeklyReset(db) {
  try {
    console.log('🔄 Otomatik haftalık reset başlatılıyor...');
    const startTime = new Date();

    // Geçen haftanın tarihlerini hesapla (Salı 03:00 - Salı 02:59)
    const lastWeek = getWeeksAgo(1);
    const weekStartStr = lastWeek.start.toISOString().split('T')[0];
    const weekEndStr = lastWeek.end.toISOString().split('T')[0];

    console.log(`📅 Reset edilen hafta: ${formatWeekRange(lastWeek.start, lastWeek.end)}`);

    // Transaction başlat
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. Geçen haftanın sıralamalarını hesapla
      const [weeklyRanking] = await connection.execute(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.points as current_total_points,
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
        GROUP BY u.id, u.username, u.email, u.points
        HAVING weekly_points > 0
        ORDER BY weekly_points DESC, correct_predictions DESC
      `, [lastWeek.start, lastWeek.end]);

      console.log(`📊 Geçen hafta ${weeklyRanking.length} kullanıcı puan kazandı`);

      // 2. İlk 3'ün bilgilerini logla (admin manuel ödül verecek)
      console.log('\n🏆 HAFTALIK KAZANANLAR (Manuel ödül verin):');
      const topUsers = weeklyRanking.slice(0, 3);
      for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const position = i + 1;
        const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉';
        console.log(`${emoji} ${position}. sıra: ${user.username} (${user.weekly_points} puan, ${user.correct_predictions} doğru tahmin)`);
      }
      if (topUsers.length === 0) {
        console.log('⚠️ Bu hafta hiç kimse puan kazanmadı.');
      }
      console.log('');

      // Not: Ödüller manuel olarak admin panelinden verilecek

      // 3. Tüm kullanıcıların puanlarını sıfırla
      const [resetResult] = await connection.execute(
        'UPDATE users SET points = 0 WHERE role = "user"'
      );

      console.log(`🔄 ${resetResult.affectedRows} kullanıcının puanı sıfırlandı`);

      // 4. Predictions tablosundaki geçici puanları da temizle
      await connection.execute(
        'UPDATE predictions SET points = 0'
      );

      await connection.commit();
      connection.release();

      const duration = new Date() - startTime;
      console.log(`✅ Otomatik haftalık reset tamamlandı! (${duration}ms)`);
      console.log(`📊 Özet: ${resetResult.affectedRows} kullanıcı sıfırlandı, ${topUsers.length} kullanıcı manuel ödül bekliyor`);

      return {
        success: true,
        weekRange: formatWeekRange(lastWeek.start, lastWeek.end),
        topUsers: topUsers,
        usersReset: resetResult.affectedRows,
        duration: duration
      };

    } catch (error) {
      console.error('❌ Reset transaction error:', error);
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('❌ Otomatik haftalık reset hatası:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Cron job'u başlat
 * Her Salı 03:00'da çalışır
 */
function startWeeklyResetCron(db) {
  // Her Salı 03:00'da çalışır (dakika saat gün ay haftanıngünü)
  cron.schedule('0 3 * * 2', async () => {
    console.log('\n🚀 Otomatik haftalık reset zamanı! (Salı 03:00)');
    await performWeeklyReset(db);
  }, {
    timezone: "Europe/Istanbul"
  });

  console.log('⏰ Haftalık reset cron job başlatıldı (Her Salı 03:00, TR saati)');
}

/**
 * Test için manuel reset (sadece development)
 */
async function testWeeklyReset(db) {
  console.log('🧪 TEST: Manuel haftalık reset çalıştırılıyor...');
  return await performWeeklyReset(db);
}

module.exports = {
  startWeeklyResetCron,
  performWeeklyReset,
  testWeeklyReset
}; 
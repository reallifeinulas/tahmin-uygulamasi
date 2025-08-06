// Haftalık reset sistemi için yardımcı fonksiyonlar
// Hafta başlangıcı: Salı 03:00, Hafta bitişi: Salı 02:59

/**
 * Verilen tarihe göre hafta başlangıcını hesaplar (Salı 03:00)
 */
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  
  // Günler: Pazar=0, Pazartesi=1, Salı=2, Çarşamba=3, Perşembe=4, Cuma=5, Cumartesi=6
  const dayOfWeek = d.getDay(); // 0-6
  const hour = d.getHours();
  
  // Salı 03:00'dan önceki günleri hesapla
  let daysToSubtract;
  
  if (dayOfWeek === 2 && hour >= 3) {
    // Salı ve saat 03:00 veya sonrası - bu haftanın başlangıcı
    daysToSubtract = 0;
  } else if (dayOfWeek === 2 && hour < 3) {
    // Salı ama saat 03:00'dan önce - geçen haftanın devamı
    daysToSubtract = 7;
  } else if (dayOfWeek > 2) {
    // Çarşamba, Perşembe, Cuma, Cumartesi
    daysToSubtract = dayOfWeek - 2;
  } else {
    // Pazar (0) veya Pazartesi (1)
    daysToSubtract = dayOfWeek + 5; // Pazar: 5 gün, Pazartesi: 6 gün geriye
  }
  
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - daysToSubtract);
  weekStart.setHours(3, 0, 0, 0); // Salı 03:00
  
  return weekStart;
}

/**
 * Verilen tarihe göre hafta bitişini hesaplar (Salı 02:59)
 */
function getWeekEnd(date = new Date()) {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7); // 7 gün ekle (bir sonraki Salı)
  weekEnd.setHours(2, 59, 59, 999); // Salı 02:59
  
  return weekEnd;
}

/**
 * Şu anki hafta için başlangıç ve bitiş tarihlerini döndürür
 */
function getCurrentWeek() {
  const now = new Date();
  return {
    start: getWeekStart(now),
    end: getWeekEnd(now)
  };
}

/**
 * Verilen haftadan N hafta öncesinin tarihlerini döndürür
 */
function getWeeksAgo(weeksBack = 0, baseDate = new Date()) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() - (weeksBack * 7));
  
  return {
    start: getWeekStart(date),
    end: getWeekEnd(date)
  };
}

/**
 * Yeni hafta başladı mı kontrol eder
 */
function isNewWeekStarted() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  
  // Salı günü saat 03:00'da yeni hafta başlar
  return dayOfWeek === 2 && hour === 3;
}

/**
 * Hafta formatını döndürür (örn: "2024-01-02 - 2024-01-08")
 */
function formatWeekRange(weekStart, weekEnd) {
  const startStr = weekStart.toLocaleDateString('tr-TR');
  const endStr = weekEnd.toLocaleDateString('tr-TR');
  return `${startStr} - ${endStr}`;
}

module.exports = {
  getWeekStart,
  getWeekEnd,
  getCurrentWeek,
  getWeeksAgo,
  isNewWeekStarted,
  formatWeekRange
}; 
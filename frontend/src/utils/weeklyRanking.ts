// Haftalık sıralama utility fonksiyonları

export const getWeekNumber = (date: Date) => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfWeek = startOfYear.getDay();
  
  // Yılın ilk salısını bulalım
  const firstTuesday = new Date(startOfYear);
  let daysToFirstTuesday;
  if (dayOfWeek <= 2) {
    daysToFirstTuesday = 2 - dayOfWeek;
  } else {
    daysToFirstTuesday = 9 - dayOfWeek;
  }
  firstTuesday.setDate(startOfYear.getDate() + daysToFirstTuesday);
  firstTuesday.setHours(3, 0, 0, 0);
  
  // Mevcut tarihin hafta başlangıcını bulalım
  const { weekStart } = getWeekBoundaries(date);
  
  const diff = weekStart.getTime() - firstTuesday.getTime();
  const weekNumber = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  
  return weekNumber;
};

export const getWeekBoundaries = (date: Date) => {
  const dayOfWeek = date.getDay();
  const hour = date.getHours();
  
  // Salı günü 03:00 başlangıcı için hesaplama
  let daysToTuesday;
  if (dayOfWeek === 2 && hour >= 3) {
    // Salı günü 03:00'dan sonraysak, bu hafta içindeyiz
    daysToTuesday = 0;
  } else if (dayOfWeek === 2 && hour < 3) {
    // Salı günü 03:00'dan önceyse, geçen hafta hala devam ediyor
    daysToTuesday = -7;
  } else if (dayOfWeek > 2) {
    // Salı'dan sonraki günlerdeyse, bu haftanın salısına git
    daysToTuesday = -(dayOfWeek - 2);
  } else {
    // Pazartesi veya Pazar'daysa, önceki salıya git
    daysToTuesday = -(dayOfWeek + 5);
  }
  
  const tuesday = new Date(date);
  tuesday.setDate(date.getDate() + daysToTuesday);
  tuesday.setHours(3, 0, 0, 0); // Salı 03:00
  
  const nextTuesday = new Date(tuesday);
  nextTuesday.setDate(tuesday.getDate() + 7);
  nextTuesday.setHours(2, 59, 59, 999); // Bir sonraki salı 02:59
  
  return { weekStart: tuesday, weekEnd: nextTuesday };
};

export const getWeekEndTime = (date: Date) => {
  const { weekEnd } = getWeekBoundaries(date);
  return weekEnd;
};

export const isWeekCompleted = (date: Date) => {
  const now = new Date();
  const weekEndTime = getWeekEndTime(date);
  
  return now >= weekEndTime;
};

export const getCurrentWeekInfo = () => {
  const now = new Date();
  const weekNumber = getWeekNumber(now);
  const year = now.getFullYear();
  const { weekStart, weekEnd } = getWeekBoundaries(now);
  const weekEndTime = getWeekEndTime(now);
  const isCompleted = isWeekCompleted(now);
  
  return {
    weekNumber,
    year,
    weekStart,
    weekEnd,
    weekEndTime,
    isCompleted
  };
};

export const formatWeekPeriod = (weekStart: Date, weekEnd: Date) => {
  const formatter = new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  // Hafta formatı: Salı 03:00 - Salı 02:59
  return `${formatter.format(weekStart)} 03:00 - ${formatter.format(weekEnd)} 02:59`;
};

export const getTimeUntilWeekEnd = () => {
  const now = new Date();
  const weekEndTime = getWeekEndTime(now);
  const diff = weekEndTime.getTime() - now.getTime();
  
  if (diff <= 0) return null;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
}; 
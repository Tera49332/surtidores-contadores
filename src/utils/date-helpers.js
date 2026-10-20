export function formatDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export function formatDateTime(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatDateShort(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short'
  }).format(date);
}

export function formatTime(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function getWeekRange(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday (0)
  
  const start = new Date(current.setDate(diff));
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

export function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function isToday(date) {
  if (!date) return false;
  const today = new Date();
  const d = new Date(date);
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
}

export function daysAgo(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(today - targetDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function toFirestoreDate(date) {
  return (date instanceof Date ? date : new Date(date)).toISOString();
}

export function fromFirestoreDate(firestoreDate) {
  if (!firestoreDate) return new Date();
  if (typeof firestoreDate === 'string') return new Date(firestoreDate);
  if (firestoreDate.toDate) return firestoreDate.toDate();
  if (firestoreDate.seconds) return new Date(firestoreDate.seconds * 1000);
  return new Date(firestoreDate);
}

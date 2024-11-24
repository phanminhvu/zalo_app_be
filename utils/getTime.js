exports.getWeek = () => {
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), 0, 1);
  const days = Math.floor((currentDate - startDate) /
    (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil(days / 7)?.toString();
  return weekNumber;
}

exports.getWeekFromDate = (date) => {
  const currentDate = new Date(date);
  const startDate = new Date(currentDate.getFullYear(), 0, 1);
  const days = Math.floor((currentDate - startDate) /
    (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil(days / 7)?.toString();
  return weekNumber;
}

exports.getStatisticsTime = (shiftDay) => {
  const event = new Date(shiftDay);
  const date = event.getDate();
  const month = event.getMonth() + 1;
  const year = event.getFullYear();
  return { date: date?.toString(), month: month?.toString(), year: year?.toString() }
}

exports.format2DigitDate = (date, month, year) => {
  const formatDate = String(date).padStart(2, '0');
  const formatMonth = String(month).padStart(2, '0');
  const formatYear = String(year).slice(-2);
  return `${formatMonth}/${formatDate}/${formatYear}`
}

exports.getTimeFromString = (plusSecond, hours, minutes, second) => {
  const timer = new Date(`2023-01-01 ${hours}:${minutes}:${second}`);
  timer.setSeconds(timer.getSeconds() + plusSecond);
  const formatTimer = timer.toLocaleTimeString([], { timeZone: "Asia/Saigon", hour12: false })
  return { hours: formatTimer.slice(0, 2), minutes: formatTimer.slice(3, 5), second: formatTimer.slice(6, 8) };
}

exports.transformLocalDateString = (date) => {
  return date.toLocaleDateString([], { timeZone: "Asia/Saigon", day: '2-digit', month: '2-digit', year: '2-digit' });
}

exports.transformLocalTimeString = (date) => {
  return date.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", timeZone: "Asia/Saigon" });
}

exports.transformLocalDateTimeString = date => {
  return date.toLocaleTimeString([], { timeZone: "Asia/Saigon", day: '2-digit', month: '2-digit', year: '2-digit', hour12: false, hour: '2-digit', minute: '2-digit' });
}

exports.checkShiftTime = () => {
  const now = new Date().toLocaleTimeString([], { timeZone: "Asia/Saigon", day: '2-digit', month: '2-digit', year: '2-digit' });
  const today = this.transformLocalDateString(new Date());
  const nextDay = new Date();
  nextDay.setDate(new Date(today).getDate() + 1);
  if (new Date(now).getTime() >= new Date(`${today}, 00:00:00 AM`).getTime() && new Date(now).getTime() < new Date(`${today}, 01:30:00 PM`).getTime()) {
    return { morningShift: true, shiftDay: today }
  }
  if (new Date(now).getTime() >= new Date(`${today}, 01:30:00 PM`).getTime() && new Date(now).getTime() < new Date(`${today}, 09:00:00 PM`).getTime()) {
    return { morningShift: false, shiftDay: today }
  }
  if (new Date(now).getTime() >= new Date(`${today}, 09:00:00 PM`).getTime() && new Date(now).getTime() < new Date(`${today}, 11:59:59 PM`).getTime()) {
    return { morningShift: true, shiftDay: this.transformLocalDateString(nextDay) }
  }
}

exports.checkShiftTimeTimerOrder = (hours, minutes, date, month, year) => {
  const now = new Date(`${month}/${date}/${year}, ${hours}:${minutes}`).toLocaleTimeString([], { timeZone: "Asia/Saigon", day: '2-digit', month: '2-digit', year: '2-digit' });
  const today = this.transformLocalDateString(new Date(`${month}/${date}/${year}`));
  const nextDay = new Date();
  nextDay.setDate(new Date(today).getDate() + 1);
  if (new Date(now).getTime() >= new Date(`${today}, 00:00:00 AM`).getTime() && new Date(now).getTime() < new Date(`${today}, 01:30:00 PM`).getTime()) {
    return { morningShift: true, shiftDay: this.getStatisticsTime(today) }
  }
  if (new Date(now).getTime() >= new Date(`${today}, 01:30:00 PM`).getTime() && new Date(now).getTime() < new Date(`${today}, 09:00:00 PM`).getTime()) {
    return { morningShift: false, shiftDay: this.getStatisticsTime(today) }
  }
  if (new Date(now).getTime() >= new Date(`${today}, 09:00:00 PM`).getTime() && new Date(now).getTime() < new Date(`${today}, 11:59:59 PM`).getTime()) {
    return { morningShift: true, shiftDay: this.getStatisticsTime(nextDay) }
  }
}

exports.generateCode = () => {
  const end = 99999999;
  const start = 11111111;
  return String(Math.floor(Math.random() * (end - start + 1) + start));
}
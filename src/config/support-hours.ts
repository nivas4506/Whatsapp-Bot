import { config } from './index.js';

export interface SupportHoursStatus {
  isWithinHours: boolean;
  message?: string;
}

export function checkSupportHours(date: Date = new Date()): SupportHoursStatus {
  // Day of week: 0 = Sun, 1 = Mon, ..., 6 = Sat
  const currentDay = date.getDay();
  const allowedDays = config.SUPPORT_DAYS.split(',').map((d) => parseInt(d.trim(), 10));

  if (!allowedDays.includes(currentDay)) {
    return {
      isWithinHours: false,
      message: `The department helpdesk is currently closed for the weekend. Our active hours are ${config.HOD_OFFICE_HOURS}. Your message will be queued for review.`,
    };
  }

  const [startH, startM] = config.SUPPORT_HOURS_START.split(':').map((n) => parseInt(n, 10));
  const [endH, endM] = config.SUPPORT_HOURS_END.split(':').map((n) => parseInt(n, 10));

  const currentH = date.getHours();
  const currentM = date.getMinutes();

  const currentTimeMins = currentH * 60 + currentM;
  const startTimeMins = startH * 60 + startM;
  const endTimeMins = endH * 60 + endM;

  if (currentTimeMins < startTimeMins || currentTimeMins > endTimeMins) {
    return {
      isWithinHours: false,
      message: `You are reaching us outside standard support hours (${config.SUPPORT_HOURS_START} - ${config.SUPPORT_HOURS_END}). Our automated guidance remains active, but staff responses will occur during working hours.`,
    };
  }

  return { isWithinHours: true };
}

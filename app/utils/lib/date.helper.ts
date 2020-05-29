export const addMinutesToADate = (date: Date, minutes: number): Date => new Date(date.setMinutes(date.getMinutes() + minutes));

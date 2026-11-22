const PRESET_HOUR = 9;

const atPresetHour = (date: Date, addDays: number): Date =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate() + addDays, PRESET_HOUR, 0, 0, 0);

export const getSchedulePresets = (now: Date): { tomorrow: Date; nextMonday: Date } => {
	const daysToMonday = (8 - now.getDay()) % 7 || 7;
	return { tomorrow: atPresetHour(now, 1), nextMonday: atPresetHour(now, daysToMonday) };
};

import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';

const DAYS: Record<string, number> = {
	Sunday: 0,
	Monday: 1,
	Tuesday: 2,
	Wednesday: 3,
	Thursday: 4,
	Friday: 5,
	Saturday: 6,
};

const MINUTES_PER_WEEK = 7 * 24 * 60;

/** Convert day name + "HH:mm:ss" to minutes since Sunday 00:00:00 */
function toMinutesSinceSunday(day: string, timeStr: string): number {
	const [h = 0, m = 0, s = 0] = timeStr.split(':').map(Number);
	return (DAYS[day] ?? 0) * 24 * 60 + h * 60 + m + s / 60;
}

function getCurrentDayAndTime(): { day: string; minutes: number } {
	const now = new Date();
	const day = now.toLocaleString('en-US', { weekday: 'long' });
	const h = now.getHours();
	const m = now.getMinutes();
	const s = now.getSeconds();
	const minutes = (DAYS[day] ?? 0) * 24 * 60 + h * 60 + m + s / 60;
	return { day, minutes };
}

export const filterBusinessHoursThatMustBeOpened = async (
	businessHours: ILivechatBusinessHour[],
): Promise<Pick<ILivechatBusinessHour, '_id' | 'type'>[]> => {
	const { day: currentDay, minutes: currentMinutes } = getCurrentDayAndTime();

	return businessHours
		.filter(
			(businessHour) =>
				businessHour.active &&
				businessHour.workHours
					.filter((hour) => hour.open)
					.some((hour) => {
						let startMinutes = toMinutesSinceSunday(hour.start.cron.dayOfWeek, `${hour.start.cron.time}:00`);
						const finishMinutes = toMinutesSinceSunday(hour.finish.cron.dayOfWeek, `${hour.finish.cron.time}:00`);

						// Overnight range (e.g. Saturday 22:00 to Sunday 02:00)
						if (startMinutes > finishMinutes) {
							return currentMinutes >= startMinutes || currentMinutes < finishMinutes;
						}

						// Same-day range: normalize for "current day is start day but start time is after current" (use previous week's start)
						if (currentDay === hour.start.cron.dayOfWeek && startMinutes > currentMinutes) {
							startMinutes -= MINUTES_PER_WEEK;
						}

						return currentMinutes >= startMinutes && currentMinutes < finishMinutes;
					}),
		)
		.map((businessHour) => ({
			_id: businessHour._id,
			type: businessHour.type,
		}));
};

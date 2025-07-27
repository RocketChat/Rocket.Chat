import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';
import moment from 'moment';

export const filterBusinessHoursThatMustBeOpened = async (
	businessHours: ILivechatBusinessHour[],
): Promise<Pick<ILivechatBusinessHour, '_id' | 'type'>[]> => {
	const currentTime = moment(moment().format('dddd:HH:mm:ss'), 'dddd:HH:mm:ss');

	return businessHours
		.filter(
			(businessHour) =>
				businessHour.active &&
				businessHour.workHours
					.filter((hour) => hour.open)
					.some((hour) => {
						const localTimeStart = moment(`${hour.start.cron.dayOfWeek}:${hour.start.cron.time}:00`, 'dddd:HH:mm:ss');
						const localTimeFinish = moment(`${hour.finish.cron.dayOfWeek}:${hour.finish.cron.time}:00`, 'dddd:HH:mm:ss');

						/** because we use `dayOfWeek` moment decides if saturday/sunday belongs to the current week or the next one, this is a bit
						 * confusing and for that reason we need this workaround
						 */
						if (localTimeStart.isAfter(localTimeFinish)) {
							localTimeStart.subtract(1, 'week');
						} else if (localTimeFinish.isBefore(localTimeStart)) {
							localTimeFinish.add(1, 'week');
						}

						return currentTime.isSameOrAfter(localTimeStart) && currentTime.isBefore(localTimeFinish);
					}),
		)
		.map((businessHour) => ({
			_id: businessHour._id,
			type: businessHour.type,
		}));
};

import moment from 'moment';
import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';
import { LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import { LivechatBusinessHours, Users } from '@rocket.chat/models';

import { createDefaultBusinessHourRow } from '../../../models/server/models/LivechatBusinessHours';

export const filterBusinessHoursThatMustBeOpened = async (
	businessHours: ILivechatBusinessHour[],
): Promise<Pick<ILivechatBusinessHour, '_id' | 'type'>[]> => {
	const currentTime = moment(moment().format('dddd:HH:mm'), 'dddd:HH:mm');

	return businessHours
		.filter(
			(businessHour) =>
				businessHour.active &&
				businessHour.workHours
					.filter((hour) => hour.open)
					.some((hour) => {
						const localTimeStart = moment(`${hour.start.cron.dayOfWeek}:${hour.start.cron.time}`, 'dddd:HH:mm');
						const localTimeFinish = moment(`${hour.finish.cron.dayOfWeek}:${hour.finish.cron.time}`, 'dddd:HH:mm');
						return currentTime.isSameOrAfter(localTimeStart) && currentTime.isSameOrBefore(localTimeFinish);
					}),
		)
		.map((businessHour) => ({
			_id: businessHour._id,
			type: businessHour.type,
		}));
};

export const filterBusinessHoursThatMustBeOpenedByDay = async (
	businessHours: ILivechatBusinessHour[],
	day: string, // Format: moment.format('dddd')
): Promise<Pick<ILivechatBusinessHour, '_id' | 'type'>[]> => {
	return filterBusinessHoursThatMustBeOpened(
		businessHours.filter((businessHour) =>
			businessHour.workHours.some((workHour) => workHour.start.utc.dayOfWeek === day || workHour.finish.utc.dayOfWeek === day),
		),
	);
};

export const openBusinessHourDefault = async (): Promise<void> => {
	await Users.removeBusinessHoursFromAllUsers();
	const currentTime = moment(moment().format('dddd:HH:mm'), 'dddd:HH:mm');
	const day = currentTime.format('dddd');
	const activeBusinessHours = await LivechatBusinessHours.findDefaultActiveAndOpenBusinessHoursByDay(day, {
		fields: {
			workHours: 1,
			timezone: 1,
			type: 1,
			active: 1,
		},
	});
	const businessHoursToOpenIds = (await filterBusinessHoursThatMustBeOpened(activeBusinessHours)).map((businessHour) => businessHour._id);
	await Users.openAgentsBusinessHoursByBusinessHourId(businessHoursToOpenIds);
	await Users.updateLivechatStatusBasedOnBusinessHours();
};

export const createDefaultBusinessHourIfNotExists = async (): Promise<void> => {
	if ((await LivechatBusinessHours.find({ type: LivechatBusinessHourTypes.DEFAULT }).count()) === 0) {
		await LivechatBusinessHours.insertOne(createDefaultBusinessHourRow());
	}
};

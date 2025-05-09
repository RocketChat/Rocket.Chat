import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';
import { ILivechatAgentStatus, LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import { LivechatBusinessHours, Users } from '@rocket.chat/models';
import moment from 'moment';

import { createDefaultBusinessHourRow } from './LivechatBusinessHours';
import { filterBusinessHoursThatMustBeOpened } from './filterBusinessHoursThatMustBeOpened';
import { notifyOnUserChangeAsync } from '../../../lib/server/lib/notifyListener';
import { businessHourLogger } from '../lib/logger';

export { filterBusinessHoursThatMustBeOpened };

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
		projection: {
			workHours: 1,
			timezone: 1,
			type: 1,
			active: 1,
		},
	});

	const businessHoursToOpenIds = (await filterBusinessHoursThatMustBeOpened(activeBusinessHours)).map((businessHour) => businessHour._id);
	businessHourLogger.debug({ msg: 'Opening default business hours', businessHoursToOpenIds });
	await Users.openAgentsBusinessHoursByBusinessHourId(businessHoursToOpenIds);
	if (businessHoursToOpenIds.length) {
		await makeOnlineAgentsAvailable();
	}
	await makeAgentsUnavailableBasedOnBusinessHour();
};

export const createDefaultBusinessHourIfNotExists = async (): Promise<void> => {
	if ((await LivechatBusinessHours.countDocuments({ type: LivechatBusinessHourTypes.DEFAULT })) === 0) {
		await LivechatBusinessHours.insertOne(createDefaultBusinessHourRow());
	}
};

export async function makeAgentsUnavailableBasedOnBusinessHour(agentIds?: string[]) {
	const results = await Users.findAgentsAvailableWithoutBusinessHours(agentIds).toArray();

	const update = await Users.updateLivechatStatusByAgentIds(
		results.map(({ _id }) => _id),
		ILivechatAgentStatus.NOT_AVAILABLE,
	);

	if (update.modifiedCount === 0) {
		return;
	}

	void notifyOnUserChangeAsync(async () =>
		results.map(({ _id, openBusinessHours }) => {
			return {
				id: _id,
				clientAction: 'updated',
				diff: {
					statusLivechat: 'not-available',
					openBusinessHours,
				},
			};
		}),
	);
}

export async function makeOnlineAgentsAvailable(agentIds?: string[]) {
	const results = await Users.findOnlineButNotAvailableAgents(agentIds).toArray();

	const update = await Users.updateLivechatStatusByAgentIds(
		results.map(({ _id }) => _id),
		ILivechatAgentStatus.AVAILABLE,
	);

	if (update.modifiedCount === 0) {
		return;
	}

	void notifyOnUserChangeAsync(async () =>
		results.map(({ _id, openBusinessHours }) => {
			return {
				id: _id,
				clientAction: 'updated',
				diff: {
					statusLivechat: 'available',
					openBusinessHours,
				},
			};
		}),
	);
}

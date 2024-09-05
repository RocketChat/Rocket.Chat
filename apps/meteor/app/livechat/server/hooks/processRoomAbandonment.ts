import type { IOmnichannelRoom, IMessage, IBusinessHourWorkHour, ILivechatDepartment } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatBusinessHours, LivechatDepartment, Messages, LivechatRooms } from '@rocket.chat/models';
import moment from 'moment';

import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';
import { businessHourManager } from '../business-hour';
import type { CloseRoomParams } from '../lib/localTypes';

export const getSecondsWhenOfficeHoursIsDisabled = (room: IOmnichannelRoom, agentLastMessage: IMessage) =>
	moment(new Date(room.closedAt || new Date())).diff(moment(new Date(agentLastMessage.ts)), 'seconds');

export const parseDays = (
	acc: Record<string, { start: { day: string; time: string }; finish: { day: string; time: string }; open: boolean }>,
	day: IBusinessHourWorkHour,
) => {
	acc[day.day] = {
		start: { day: day.start.utc.dayOfWeek, time: day.start.utc.time },
		finish: { day: day.finish.utc.dayOfWeek, time: day.finish.utc.time },
		open: day.open,
	};
	return acc;
};

export const getSecondsSinceLastAgentResponse = async (room: IOmnichannelRoom, agentLastMessage: IMessage) => {
	if (!settings.get('Livechat_enable_business_hours')) {
		return getSecondsWhenOfficeHoursIsDisabled(room, agentLastMessage);
	}
	let officeDays;
	const department = room.departmentId
		? await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'businessHourId'>>(room.departmentId, {
				projection: { businessHourId: 1 },
		  })
		: null;
	if (department?.businessHourId) {
		const businessHour = await LivechatBusinessHours.findOneById(department.businessHourId);
		if (!businessHour) {
			return getSecondsWhenOfficeHoursIsDisabled(room, agentLastMessage);
		}

		officeDays = (await businessHourManager.getBusinessHour(businessHour._id, businessHour.type))?.workHours.reduce(parseDays, {});
	} else {
		officeDays = (await businessHourManager.getBusinessHour())?.workHours.reduce(parseDays, {});
	}

	// Empty object we assume invalid config
	if (!officeDays || !Object.keys(officeDays).length) {
		return getSecondsWhenOfficeHoursIsDisabled(room, agentLastMessage);
	}

	let totalSeconds = 0;
	const endOfConversation = moment.utc(new Date(room.closedAt || new Date()));
	const startOfInactivity = moment.utc(new Date(agentLastMessage.ts));
	const daysOfInactivity = endOfConversation.clone().startOf('day').diff(startOfInactivity.clone().startOf('day'), 'days');
	const inactivityDay = moment.utc(new Date(agentLastMessage.ts));

	for (let index = 0; index <= daysOfInactivity; index++) {
		const today = inactivityDay.clone().format('dddd');
		const officeDay = officeDays[today];

		if (!officeDay) {
			inactivityDay.add(1, 'days');
			continue;
		}

		if (!officeDay.open) {
			inactivityDay.add(1, 'days');
			continue;
		}

		if (!officeDay?.start?.time || !officeDay?.finish?.time) {
			inactivityDay.add(1, 'days');
			continue;
		}

		const [officeStartHour, officeStartMinute] = officeDay.start.time.split(':');
		const [officeCloseHour, officeCloseMinute] = officeDay.finish.time.split(':');
		// We should only take in consideration the time where the office is open and the conversation was inactive
		const todayStartOfficeHours = inactivityDay
			.clone()
			.set({ hour: parseInt(officeStartHour, 10), minute: parseInt(officeStartMinute, 10) });
		const todayEndOfficeHours = inactivityDay.clone().set({ hour: parseInt(officeCloseHour, 10), minute: parseInt(officeCloseMinute, 10) });

		// 1: Room was inactive the whole day, we add the whole time BH is inactive
		if (startOfInactivity.isBefore(todayStartOfficeHours) && endOfConversation.isAfter(todayEndOfficeHours)) {
			totalSeconds += todayEndOfficeHours.diff(todayStartOfficeHours, 'seconds');
		}

		// 2: Room was inactive before start but was closed before end of BH, we add the inactive time
		if (startOfInactivity.isBefore(todayStartOfficeHours) && endOfConversation.isBefore(todayEndOfficeHours)) {
			totalSeconds += endOfConversation.diff(todayStartOfficeHours, 'seconds');
		}

		// 3: Room was inactive after start and ended after end of BH, we add the inactive time
		if (startOfInactivity.isAfter(todayStartOfficeHours) && endOfConversation.isAfter(todayEndOfficeHours)) {
			totalSeconds += todayEndOfficeHours.diff(startOfInactivity, 'seconds');
		}

		// 4: Room was inactive after start and before end of BH, we add the inactive time
		if (startOfInactivity.isAfter(todayStartOfficeHours) && endOfConversation.isBefore(todayEndOfficeHours)) {
			totalSeconds += endOfConversation.diff(startOfInactivity, 'seconds');
		}

		inactivityDay.add(1, 'days');
	}
	return totalSeconds;
};

export const onCloseRoom = async (params: { room: IOmnichannelRoom; options: CloseRoomParams['options'] }) => {
	const { room } = params;

	if (!isOmnichannelRoom(room)) {
		return params;
	}

	const closedByAgent = room.closer !== 'visitor';
	const wasTheLastMessageSentByAgent = room.lastMessage && !room.lastMessage.token;
	if (!closedByAgent || !wasTheLastMessageSentByAgent) {
		return params;
	}

	if (!room.v?.lastMessageTs) {
		return params;
	}

	const agentLastMessage = await Messages.findAgentLastMessageByVisitorLastMessageTs(room._id, room.v.lastMessageTs);
	if (!agentLastMessage) {
		return params;
	}
	const secondsSinceLastAgentResponse = await getSecondsSinceLastAgentResponse(room, agentLastMessage);
	await LivechatRooms.setVisitorInactivityInSecondsById(room._id, secondsSinceLastAgentResponse);

	return params;
};

callbacks.add('livechat.closeRoom', onCloseRoom, callbacks.priority.HIGH, 'process-room-abandonment');

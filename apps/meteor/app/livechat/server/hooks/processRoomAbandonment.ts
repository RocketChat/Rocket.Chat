import type { IOmnichannelRoom, IMessage, IBusinessHourWorkHour, ILivechatDepartment } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatBusinessHours, LivechatDepartment, Messages, LivechatRooms } from '@rocket.chat/models';
import moment from 'moment';

import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';
import { businessHourManager } from '../business-hour';

const getSecondsWhenOfficeHoursIsDisabled = (room: IOmnichannelRoom, agentLastMessage: IMessage) =>
	moment(new Date(room.closedAt || new Date())).diff(moment(new Date(agentLastMessage.ts)), 'seconds');

const parseDays = (
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

const getSecondsSinceLastAgentResponse = async (room: IOmnichannelRoom, agentLastMessage: IMessage) => {
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

	if (!officeDays) {
		return getSecondsWhenOfficeHoursIsDisabled(room, agentLastMessage);
	}

	let totalSeconds = 0;
	const endOfConversation = moment(new Date(room.closedAt || new Date()));
	const startOfInactivity = moment(new Date(agentLastMessage.ts));
	const daysOfInactivity = endOfConversation.clone().startOf('day').diff(startOfInactivity.clone().startOf('day'), 'days');
	const inactivityDay = moment(new Date(agentLastMessage.ts));
	for (let index = 0; index <= daysOfInactivity; index++) {
		const today = inactivityDay.clone().format('dddd');
		const officeDay = officeDays[today];
		const startTodaysOfficeHour = moment(`${officeDay.start.day}:${officeDay.start.time}`, 'dddd:HH:mm').add(index, 'days');
		const endTodaysOfficeHour = moment(`${officeDay.finish.day}:${officeDay.finish.time}`, 'dddd:HH:mm').add(index, 'days');
		if (officeDays[today].open) {
			const firstDayOfInactivity = startOfInactivity.clone().format('D') === inactivityDay.clone().format('D');
			const lastDayOfInactivity = endOfConversation.clone().format('D') === inactivityDay.clone().format('D');

			if (!firstDayOfInactivity && !lastDayOfInactivity) {
				totalSeconds += endTodaysOfficeHour.clone().diff(startTodaysOfficeHour, 'seconds');
			} else {
				const end = endOfConversation.isBefore(endTodaysOfficeHour) ? endOfConversation : endTodaysOfficeHour;
				const start = firstDayOfInactivity ? inactivityDay : startTodaysOfficeHour;
				totalSeconds += end.clone().diff(start, 'seconds');
			}
		}
		inactivityDay.add(1, 'days');
	}
	return totalSeconds;
};

callbacks.add(
	'livechat.closeRoom',
	async (params) => {
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
	},
	callbacks.priority.HIGH,
	'process-room-abandonment',
);

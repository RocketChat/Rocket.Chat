import moment from 'moment';

import { settings } from '../../../settings';
import { callbacks } from '../../../../lib/callbacks';
import { LivechatRooms, Messages } from '../../../models/server';
import { businessHourManager } from '../business-hour';
import { LivechatBusinessHours, LivechatDepartment } from '../../../models/server/raw';

const getSecondsWhenOfficeHoursIsDisabled = (room, agentLastMessage) =>
	moment(new Date(room.closedAt)).diff(moment(new Date(agentLastMessage.ts)), 'seconds');
const parseDays = (acc, day) => {
	acc[day.day] = {
		start: { day: day.start.utc.dayOfWeek, time: day.start.utc.time },
		finish: { day: day.finish.utc.dayOfWeek, time: day.finish.utc.time },
		open: day.open,
	};
	return acc;
};

const getSecondsSinceLastAgentResponse = async (room, agentLastMessage) => {
	if (!settings.get('Livechat_enable_business_hours')) {
		return getSecondsWhenOfficeHoursIsDisabled(room, agentLastMessage);
	}
	let officeDays;
	const department = room.departmentId && (await LivechatDepartment.findOneById(room.departmentId));
	if (department && department.businessHourId) {
		const businessHour = await LivechatBusinessHours.findOneById(department.businessHourId);
		officeDays = (await businessHourManager.getBusinessHour(businessHour._id, businessHour.type)).workHours.reduce(parseDays, {});
	} else {
		officeDays = (await businessHourManager.getBusinessHour()).workHours.reduce(parseDays, {});
	}
	let totalSeconds = 0;
	const endOfConversation = moment(new Date(room.closedAt));
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
	(room) => {
		const closedByAgent = room.closer !== 'visitor';
		const wasTheLastMessageSentByAgent = room.lastMessage && !room.lastMessage.token;
		if (!closedByAgent || !wasTheLastMessageSentByAgent) {
			return;
		}
		const agentLastMessage = Messages.findAgentLastMessageByVisitorLastMessageTs(room._id, room.v.lastMessageTs);
		if (!agentLastMessage) {
			return;
		}
		const secondsSinceLastAgentResponse = Promise.await(getSecondsSinceLastAgentResponse(room, agentLastMessage));
		LivechatRooms.setVisitorInactivityInSecondsById(room._id, secondsSinceLastAgentResponse);

		return room;
	},
	callbacks.priority.HIGH,
	'process-room-abandonment',
);

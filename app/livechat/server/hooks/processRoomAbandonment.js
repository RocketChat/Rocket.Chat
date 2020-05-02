import moment from 'moment';

import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { LivechatRooms, Messages, LivechatOfficeHour } from '../../../models';

const getSecondsWhenOfficeHoursIsDisabled = (room, agentLastMessage) => moment(new Date(room.closedAt)).diff(moment(new Date(agentLastMessage.ts)), 'seconds');
const getOfficeHoursDictionary = () => LivechatOfficeHour.find().fetch().reduce((acc, day) => {
	acc[day.day] = {
		start: day.start,
		finish: day.finish,
		open: day.open,
	};
	return acc;
}, {});
const getSecondsSinceLastAgentResponse = (room, agentLastMessage) => {
	if (!settings.get('Livechat_enable_office_hours')) {
		return getSecondsWhenOfficeHoursIsDisabled(room, agentLastMessage);
	}

	let totalSeconds = 0;
	const officeDays = getOfficeHoursDictionary();
	const endOfConversation = moment(new Date(room.closedAt));
	const startOfInactivity = moment(new Date(agentLastMessage.ts));
	const daysOfInactivity = endOfConversation.clone().startOf('day').diff(startOfInactivity.clone().startOf('day'), 'days');
	const inactivityDay = moment(new Date(agentLastMessage.ts));

	for (let index = 0; index <= daysOfInactivity; index++) {
		const today = inactivityDay.clone().format('dddd');
		const officeDay = officeDays[today];
		const startTodaysOfficeHour = moment(officeDay.start, 'HH:mm').add(index, 'days');
		const endTodaysOfficeHour = moment(officeDay.finish, 'HH:mm').add(index, 'days');
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

callbacks.add('livechat.closeRoom', (room) => {
	const closedByAgent = room.closer !== 'visitor';
	const wasTheLastMessageSentByAgent = room.lastMessage && !room.lastMessage.token;
	if (!closedByAgent || !wasTheLastMessageSentByAgent) {
		return;
	}
	const agentLastMessage = Messages.findAgentLastMessageByVisitorLastMessageTs(room._id, room.v.lastMessageTs);
	if (!agentLastMessage) {
		return;
	}
	const secondsSinceLastAgentResponse = getSecondsSinceLastAgentResponse(room, agentLastMessage);
	LivechatRooms.setVisitorInactivityInSecondsById(room._id, secondsSinceLastAgentResponse);
}, callbacks.priority.HIGH, 'process-room-abandonment');

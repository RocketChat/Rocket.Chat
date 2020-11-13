import {
	getDateDiff,
	getDate,
	cloneDate,
	getDateStart,
	getDateWithFormat,
	addDate,
	checkDateIsBefore,
} from '../../../../lib/rocketchat-dates';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { LivechatRooms, Messages } from '../../../models/server';
import { businessHourManager } from '../business-hour';
import { LivechatBusinessHours, LivechatDepartment } from '../../../models/server/raw';

const getSecondsWhenOfficeHoursIsDisabled = (room, agentLastMessage) => getDateDiff(getDate(new Date(room.closedAt)), getDate(new Date(agentLastMessage.ts), 'seconds'));
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
	const department = room.departmentId && await LivechatDepartment.findOneById(room.departmentId);
	if (department && department.businessHourId) {
		const businessHour = await LivechatBusinessHours.findOneById(department.businessHourId);
		officeDays = (await businessHourManager.getBusinessHour(businessHour._id, businessHour.type)).workHours.reduce(parseDays, {});
	} else {
		officeDays = (await businessHourManager.getBusinessHour()).workHours.reduce(parseDays, {});
	}
	let totalSeconds = 0;
	const endOfConversation = getDate(new Date(room.closedAt));
	const startOfInactivity = getDate(new Date(agentLastMessage.ts));
	const daysOfInactivity = getDateDiff(getDateStart(cloneDate(endOfConversation), 'day'), getDateStart(cloneDate(startOfInactivity), 'day'), 'days');
	const inactivityDay = getDate(new Date(agentLastMessage.ts));
	for (let index = 0; index <= daysOfInactivity; index++) {
		const today = getDateWithFormat(cloneDate(inactivityDay), 'dddd');
		const officeDay = officeDays[today];
		const startTodaysOfficeHour = addDate(getDate(`${ officeDay.start.day }:${ officeDay.start.time }`, 'dddd:HH:mm'), index, 'days');
		const endTodaysOfficeHour = addDate(getDate(`${ officeDay.finish.day }:${ officeDay.finish.time }`, 'dddd:HH:mm'), index, 'days');
		if (officeDays[today].open) {
			const firstDayOfInactivity = getDateWithFormat(cloneDate(startOfInactivity), 'D') === getDateWithFormat(cloneDate(inactivityDay), 'D');
			const lastDayOfInactivity = getDateWithFormat(cloneDate(endOfConversation), 'D') === getDateWithFormat(cloneDate(inactivityDay), 'D');

			if (!firstDayOfInactivity && !lastDayOfInactivity) {
				totalSeconds += getDateDiff(cloneDate(endTodaysOfficeHour), startTodaysOfficeHour, 'seconds');
			} else {
				const end = checkDateIsBefore(endOfConversation, endTodaysOfficeHour) ? endOfConversation : endTodaysOfficeHour;
				const start = firstDayOfInactivity ? inactivityDay : startTodaysOfficeHour;
				totalSeconds += getDateDiff(cloneDate(end), start, 'seconds');
			}
		}
		addDate(inactivityDay, 1, 'days');
	}
	return totalSeconds;
};

callbacks.add('livechat.closeRoom', async (room) => {
	const closedByAgent = room.closer !== 'visitor';
	const wasTheLastMessageSentByAgent = room.lastMessage && !room.lastMessage.token;
	if (!closedByAgent || !wasTheLastMessageSentByAgent) {
		return;
	}
	const agentLastMessage = Messages.findAgentLastMessageByVisitorLastMessageTs(room._id, room.v.lastMessageTs);
	if (!agentLastMessage) {
		return;
	}
	const secondsSinceLastAgentResponse = await getSecondsSinceLastAgentResponse(room, agentLastMessage);
	LivechatRooms.setVisitorInactivityInSecondsById(room._id, secondsSinceLastAgentResponse);
}, callbacks.priority.HIGH, 'process-room-abandonment');

import moment from 'moment';

import { callbacks } from '../../../callbacks/server';
import { LivechatRooms, LivechatDepartment } from '../../../models/server';
import { settings } from '../../../settings/server';

callbacks.add('afterSaveMessage', function(message, room) {
	if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
		return message;
	}
	const sentByAgent = !message.token;
	if (sentByAgent) {
		const department = LivechatDepartment.findOneById(room.departmentId);
		let secondsToAdd = settings.get('Livechat_visitor_inactivity_timeout');
		if (department) {
			secondsToAdd = department.visitorInactivityTimeoutInSeconds || settings.get('Livechat_visitor_inactivity_timeout');
		}
		let willBeInactiveAt = room.v.lastMessageTs;
		if (secondsToAdd) {
			willBeInactiveAt = moment(room.v.lastMessageTs).add(Number(secondsToAdd), 'seconds').toDate();
		}
		LivechatRooms.setTimeWhenRoomWillBeInactive(room._id, willBeInactiveAt);
	}
	return message;
}, callbacks.priority.HIGH, 'save-visitor-inactivity');

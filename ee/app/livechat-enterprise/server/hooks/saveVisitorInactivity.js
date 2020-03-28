import { callbacks } from '../../../../../app/callbacks/server';
import { settings } from '../../../../../app/settings/server';
import { setVisitorInactivity } from '../lib/Helper';

callbacks.add('afterSaveMessage', function(message, room) {
	if (!settings.get('Livechat_auto_close_inactive_rooms')) {
		return message;
	}
	if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
		return message;
	}
	const sentByAgent = !message.token;
	if (sentByAgent) {
		setVisitorInactivity(room);
	}
	return message;
}, callbacks.priority.HIGH, 'save-visitor-inactivity');

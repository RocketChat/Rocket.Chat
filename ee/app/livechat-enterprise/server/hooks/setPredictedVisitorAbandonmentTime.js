import { callbacks } from '../../../../../app/callbacks/server';
import { settings } from '../../../../../app/settings/server';
import { setPredictedVisitorAbandonmentTime } from '../lib/Helper';

callbacks.add('afterSaveMessage', function(message, room) {
	if (!settings.get('Livechat_auto_close_abandoned_rooms') || settings.get('Livechat_visitor_inactivity_timeout') <= 0) {
		return message;
	}
	// skips this callback if the message was edited
	if (message.editedAt) {
		return false;
	}
	// message valid only if it is a livechat room
	if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
		return false;
	}
	// if the message has a type means it is a special message (like the closing comment), so skips
	if (message.t) {
		return false;
	}
	const sentByAgent = !message.token;
	if (sentByAgent) {
		setPredictedVisitorAbandonmentTime(room);
	}
	return message;
}, callbacks.priority.HIGH, 'save-visitor-inactivity');

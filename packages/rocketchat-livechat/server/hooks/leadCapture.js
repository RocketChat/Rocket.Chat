import LivechatVisitors from '../../server/models/LivechatVisitors';

function validateMessage(message, room) {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return false;
	}

	// message valid only if it is a livechat room
	if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
		return false;
	}

	// if the message hasn't a token, it was NOT sent from the visitor, so ignore it
	if (!message.token) {
		return false;
	}

	// if the message has a type means it is a special message (like the closing comment), so skips
	if (message.t) {
		return false;
	}

	return true;
}

RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	if (!validateMessage(message, room)) {
		return message;
	}

	const phoneRegexp = new RegExp(RocketChat.settings.get('Livechat_lead_phone_regex'), 'g');
	const msgPhones = message.msg.match(phoneRegexp);

	const emailRegexp = new RegExp(RocketChat.settings.get('Livechat_lead_email_regex'), 'gi');
	const msgEmails = message.msg.match(emailRegexp);

	if (msgEmails || msgPhones) {
		LivechatVisitors.saveGuestEmailPhoneById(room.v._id, msgEmails, msgPhones);

		RocketChat.callbacks.run('livechat.leadCapture', room);
	}

	return message;
}, RocketChat.callbacks.priority.LOW, 'leadCapture');

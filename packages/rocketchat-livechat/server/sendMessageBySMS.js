RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	if (!RocketChat.SMS.enabled) {
		return message;
	}

	// only send the sms by SMS if it is a livechat room with SMS set to true
	if (typeof room.t === 'undefined' || room.t !== 'l' || !room.sms || !room.v || !room.v.token) {
		return message;
	}

	// if the message has a token, it was sent from the visitor, so ignore it
	if (message.token) {
		return message;
	}

	const SMSService = RocketChat.SMS.getService(RocketChat.settings.get('SMS_Service'));

	if (!SMSService) {
		return message;
	}

	const visitor = RocketChat.models.Users.getVisitorByToken(room.v.token);

	if (!visitor || !visitor.profile || !visitor.profile.phones || visitor.profile.phones.length === 0) {
		return message;
	}

	SMSService.send(room.sms.from, visitor.profile.phones[0].number, message.msg);

	return message;

}, RocketChat.callbacks.priority.LOW);

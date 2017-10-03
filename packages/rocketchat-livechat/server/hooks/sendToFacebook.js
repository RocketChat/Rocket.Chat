RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited
	// if (message.editedAt) {
	// 	return message;
	// }

	// TODO: check facebook integration
	// if (!RocketChat.SMS.enabled) {
	// 	return message;
	// }

	// only send the sms by SMS if it is a livechat room with SMS set to true
	if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.facebook && room.v && room.v.token)) {
		return message;
	}

	// if the message has a token, it was sent from the visitor, so ignore it
	if (message.token) {
		return message;
	}

	// if the message has a type means it is a special message (like the closing comment), so skips
	if (message.t) {
		return message;
	}

	const result = HTTP.call('POST', 'http://localhost:3000/facebook/reply', {
		headers: {
			'x-rocketchat-instance': RocketChat.settings.get('uniqueID')
		},
		data: {
			page: room.facebook.page,
			token: room.v.token,
			text: message.msg
		}
	});

	console.log('result ->', result);

	return message;

}, RocketChat.callbacks.priority.LOW, 'sendMessageToFacebook');

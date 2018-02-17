function sendToRDStation(room) {
	if (!RocketChat.settings.get('Livechat_RDStation_Token')) {
		return room;
	}

	const livechatData = RocketChat.Livechat.getLivechatRoomGuestInfo(room);

	if (!livechatData.visitor.email) {
		return room;
	}

	const options = {
		headers: {
			'Content-Type': 'application/json'
		},
		data: {
			token_rdstation: RocketChat.settings.get('Livechat_RDStation_Token'),
			identificador: 'rocketchat-livechat',
			client_id: livechatData.visitor._id,
			email: livechatData.visitor.email
		}
	};

	options.data.nome = livechatData.visitor.name || livechatData.visitor.username;

	if (livechatData.visitor.phone) {
		options.data.telefone = livechatData.visitor.phone;
	}

	if (livechatData.tags) {
		options.data.tags = livechatData.tags;
	}

	Object.keys(livechatData.customFields || {}).forEach(field => {
		options.data[field] = livechatData.customFields[field];
	});

	Object.keys(livechatData.visitor.customFields || {}).forEach(field => {
		options.data[field] = livechatData.visitor.customFields[field];
	});

	try {
		HTTP.call('POST', 'https://www.rdstation.com.br/api/1.3/conversions', options);
	} catch (e) {
		console.error('Error sending lead to RD Station ->', e);
	}

	return room;
}

RocketChat.callbacks.add('livechat.closeRoom', sendToRDStation, RocketChat.callbacks.priority.MEDIUM, 'livechat-rd-station-close-room');

RocketChat.callbacks.add('livechat.saveInfo', sendToRDStation, RocketChat.callbacks.priority.MEDIUM, 'livechat-rd-station-save-info');

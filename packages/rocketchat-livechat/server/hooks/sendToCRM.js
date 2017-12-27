function sendToCRM(type, room, includeMessages = true) {
	const postData = RocketChat.Livechat.getLivechatRoomGuestInfo(room);

	postData.type = type;

	postData.messages = [];

	if (includeMessages) {
		RocketChat.models.Messages.findVisibleByRoomId(room._id, { sort: { ts: 1 } }).forEach((message) => {
			if (message.t) {
				return;
			}
			const msg = {
				username: message.u.username,
				msg: message.msg,
				ts: message.ts
			};

			if (message.u.username !== postData.visitor.username) {
				msg.agentId = message.u._id;
			}
			postData.messages.push(msg);
		});
	}

	const response = RocketChat.Livechat.sendRequest(postData);

	if (response && response.data && response.data.data) {
		RocketChat.models.Rooms.saveCRMDataByRoomId(room._id, response.data.data);
	}

	return room;
}

RocketChat.callbacks.add('livechat.closeRoom', (room) => {
	if (!RocketChat.settings.get('Livechat_webhook_on_close')) {
		return room;
	}

	return sendToCRM('LivechatSession', room);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-close-room');

RocketChat.callbacks.add('livechat.saveInfo', (room) => {
	// Do not send to CRM if the chat is still open
	if (room.open) {
		return room;
	}

	return sendToCRM('LivechatEdit', room);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-save-info');

RocketChat.callbacks.add('livechat.leadCapture', (room) => {
	return sendToCRM('LeadCapture', room, false);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-lead-capture');

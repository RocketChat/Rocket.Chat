RocketChat.callbacks.add('livechat.saveLivechatInfo', (room) => {
	if (!RocketChat.settings.get('Livechat_webhook_on_close')) {
		return room;
	}

	if (room.open) {
		return room;
	}

	let postData = RocketChat.Livechat.getLivechatRoomGuestInfo(room);
	postData.type = 'LivechatEdit';

	const response = RocketChat.Livechat.sendRequest(postData);
	console.log('response ->', response);

	if (response && response.data && response.data.data) {
		RocketChat.models.Rooms.saveCRMDataByRoomId(room._id, response.data.data);
	}
});

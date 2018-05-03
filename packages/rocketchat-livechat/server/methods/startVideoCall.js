/* eslint new-cap: [2, {"capIsNewExceptions": ["MD5"]}] */
Meteor.methods({
	'livechat:startVideoCall'(roomId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:closeByVisitor' });
		}

		const guest = Meteor.user();

		const message = {
			_id: Random.id(),
			rid: roomId || Random.id(),
			msg: '',
			ts: new Date()
		};

		const { room } = RocketChat.Livechat.getRoom(guest, message, { jitsiTimeout: new Date(Date.now() + 3600 * 1000) });
		message.rid = room._id;

		RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('livechat_video_call', room._id, '', guest, {
			actionLinks: [
				{ icon: 'icon-videocam', i18nLabel: 'Accept', method_id: 'createLivechatCall', params: '' },
				{ icon: 'icon-cancel', i18nLabel: 'Decline', method_id: 'denyLivechatCall', params: '' }
			]
		});

		return {
			roomId: room._id,
			domain: RocketChat.settings.get('Jitsi_Domain'),
			jitsiRoom: RocketChat.settings.get('Jitsi_URL_Room_Prefix') + RocketChat.settings.get('uniqueID') + roomId
		};
	}
});


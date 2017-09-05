Meteor.startup(function() {
	RocketChat.ChannelSettings.addOption({
		group: ['room'],
		id: 'tokenly',
		template: 'channelSettings__tokenly',
		validation(data) {
			if (data && data.rid) {
				const room = RocketChat.models.Rooms.findOne(data.rid, { fields: { tokenpass: 1 } });

				return room && room.tokenpass;
			}

			return false;
		}
	});
});

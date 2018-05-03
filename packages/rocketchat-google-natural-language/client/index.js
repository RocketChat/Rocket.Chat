Template.room.helpers({
	sentimentSmile() {
		if (!RocketChat.settings.get('GoogleNaturalLanguage_Enabled')) {
			return;
		}

		const room = ChatRoom.findOne(this._id, { fields: { sentiment: 1 } });

		if (room.sentiment >= 0.3) {
			return ':)';
		} else if (room.sentiment >= -0.3) {
			return ':|';
		} else if (room.sentiment < -0.3) {
			return ':(';
		}
	}
});

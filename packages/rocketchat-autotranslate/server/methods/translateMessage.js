Meteor.methods({
	'autoTranslate.translateMessage'(message) {
		const room = RocketChat.models.Rooms.findOneById(message && message.rid);
		if (message && room && RocketChat.AutoTranslate) {
			return RocketChat.AutoTranslate.translateMessage(message, room);
		}
	}
});

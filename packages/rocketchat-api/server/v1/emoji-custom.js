RocketChat.API.v1.addRoute('emoji-custom', { authRequired: true }, {
	get() {
		const emojis = Meteor.call('listEmojiCustom');

		return RocketChat.API.v1.success({ emojis });
	}
});

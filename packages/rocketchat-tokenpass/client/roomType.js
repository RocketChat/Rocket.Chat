RocketChat.roomTypes.add('tokenpass', 1, {
	customTemplate: 'tokenChannelsList',
	condition() {
		const user = Meteor.user();
		const hasTokenpass = !!(user && user.services && user.services.tokenpass);

		return hasTokenpass;
	}
});

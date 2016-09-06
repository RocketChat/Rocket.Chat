Meteor.methods({
	'livechat:changeLivechatStatus'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:changeLivechatStatus' });
		}

		const user = Meteor.user();

		let newStatus = user.statusLivechat === 'available' ? 'not-available' : 'available';

		return RocketChat.models.Users.setLivechatStatus(user._id, newStatus);
	}
});

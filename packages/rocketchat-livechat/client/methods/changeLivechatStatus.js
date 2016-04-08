Meteor.methods({
	'livechat:changeLivechatStatus'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized');
		}

		const user = Meteor.user();

		let newStatus = user.statusLivechat === 'available' ? 'not-available' : 'available';

		Meteor.users.update(user._id, { $set: { statusLivechat: newStatus }});
	}
});

Meteor.methods({
	'livechat:takeInquiry'(inquiry, agent) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveDepartment' });
		}

		return RocketChat.models.LivechatInquiry.takeInquiry(inquiry, agent);
	}
});
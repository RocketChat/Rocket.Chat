Meteor.methods({
	'livechat:getInquiries'(filter) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:getInquiries' });
		}

		return RocketChat.models.LivechatInquiry.find(filter || {}).fetch();
	},
});

Meteor.methods({
	'livechat:closeInquiry'(rid) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:closeInquiry' });
		}

		// find inquiry corresponding to room
		const inquiry = RocketChat.models.LivechatInquiry.findOne({ rid });

		// mark inquiry as open
		return RocketChat.models.LivechatInquiry.closeInquiry(inquiry._id);
	},
});

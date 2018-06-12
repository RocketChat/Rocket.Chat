Meteor.methods({
	'livechat:updateVisitorStatus'(token, status) {
		check(token, String);
		check(status, String);

		RocketChat.models.LivechatInquiry.updateVisitorStatus(token, status);
		RocketChat.models.Rooms.updateVisitorStatus(token, status);
	}
});

Meteor.methods({
	'livechat:setDepartmentForVisitor'({ token, department } = {}) {
		RocketChat.Livechat.setDepartmentForGuest.call(this, {
			token,
			department
		});

		// update visited page history to not expire
		RocketChat.models.LivechatPageVisited.keepHistoryForToken(token);

		return true;
	}
});

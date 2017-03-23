Meteor.methods({
	'livechat:setDepartmentForVisitor': function({ token, department } = {}) {
		RocketChat.Livechat.setDepartmentForGuest.call(this, {
			token: token,
			department: department
		});

		// update visited page history to not expire
		RocketChat.models.LivechatPageVisited.keepHistoryForToken(token);

		return true;
	}
});

Meteor.methods({
	'livechat:setDepartmentForVisitor'({ token, department } = {}) {
		RocketChat.Livechat.setDepartmentForGuest.call(this, {
			token,
			department
		});

		return true;
	}
});

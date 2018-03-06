Meteor.methods({
	setUserStatus(statusType, statusText) {
		Meteor.call('UserPresence:setDefaultStatus', statusType);

		const userId = Meteor.userId();
		RocketChat.models.Users.updateStatusText(userId, statusText);
	}
});

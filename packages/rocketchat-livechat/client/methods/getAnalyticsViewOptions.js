Meteor.methods({
	'livechat:getAnalyticsViewOptions'() {
		if (!Meteor.userId()) {
			return false;
		}

		const options = {
		};
		return options;
	}
});

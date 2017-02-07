Meteor.methods({
	reportMessage(message, description) {
		check(message, Object);
		check(description, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'reportMessage'
			});
		}

		if ((description == null) || description.trim() === '') {
			throw new Meteor.Error('error-invalid-description', 'Invalid description', {
				method: 'reportMessage'
			});
		}

		return RocketChat.models.Reports.createWithMessageDescriptionAndUserId(message, description, Meteor.userId());
	}
});

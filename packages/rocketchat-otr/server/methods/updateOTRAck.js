Meteor.methods({
	updateOTRAck(_id, ack) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'updateOTRAck' });
		}
		RocketChat.models.Messages.updateOTRAck(_id, ack);
	}
});

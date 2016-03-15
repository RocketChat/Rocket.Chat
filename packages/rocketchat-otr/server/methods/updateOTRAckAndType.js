Meteor.methods({
	updateOTRAckAndType: function(_id, ack) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('invalid-user', '[methods] deleteOldOTRMessages -> Invalid user');
		}
		RocketChat.models.Messages.updateOTRAckAndType(_id, ack);
	}
});

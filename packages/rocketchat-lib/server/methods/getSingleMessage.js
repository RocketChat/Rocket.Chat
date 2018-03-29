Meteor.methods({
	getSingleMessage(msgId) {
		check(msgId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getSingleMessage' });
		}

		const msg = RocketChat.models.Messages.findOneById(msgId);

		if (!msg && !msg.rid) {
			return undefined;
		}

		Meteor.call('canAccessRoom', msg.rid, Meteor.userId());

		return msg;
	}
});

Meteor.methods({
	cleanChannelHistory({roomId, latest, oldest, inclusive}) {
		check(roomId, String);
		check(latest, Date);
		check(oldest, Date);
		check(inclusive, Boolean);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cleanChannelHistory' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'clean-channel-history')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'cleanChannelHistory' });
		}

		if (inclusive) {
			RocketChat.models.Messages.remove({
				rid: roomId,
				ts: {
					$gte: oldest,
					$lte: latest
				}
			});
		} else {
			RocketChat.models.Messages.remove({
				rid: roomId,
				ts: {
					$gt: oldest,
					$lt: latest
				}
			});
		}
	}
});

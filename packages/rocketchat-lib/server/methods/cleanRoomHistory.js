/* globals FileUpload */

Meteor.methods({
	cleanRoomHistory({ roomId, latest, oldest, inclusive }) {
		check(roomId, String);
		check(latest, Date);
		check(oldest, Date);
		check(inclusive, Boolean);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cleanRoomHistory' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'clean-channel-history')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'cleanRoomHistory' });
		}
		const gt = inclusive ? '$gte' : '$gt';
		const lt = inclusive ? '$lte' : '$lt';
		RocketChat.models.Messages.find({
			rid: roomId,
			ts: {
				[gt]: oldest,
				[lt]: latest
			}
		}).fetch().map(file => {
			if (file.file && file.file._id) {
				FileUpload.getStore('Uploads').deleteById(file.file._id);
			}
		});
		RocketChat.models.Messages.remove({
			rid: roomId,
			ts: {
				[gt]: oldest,
				[lt]: latest
			}
		});
		RocketChat.models.Uploads.remove({
			rid: roomId,
			uploadedAt: {
				[gt]: oldest,
				[lt]: latest
			}
		});
	}
});

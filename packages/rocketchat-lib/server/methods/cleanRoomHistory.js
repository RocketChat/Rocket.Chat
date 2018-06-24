/* globals FileUpload */

Meteor.methods({
	cleanRoomHistory({ roomId, latest, oldest, inclusive, limit }) {
		check(roomId, String);
		check(latest, Date);
		check(oldest, Date);
		check(inclusive, Boolean);
		check(limit, Match.Maybe(Number));

		if (!limit) {
			limit = 0;
		}

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cleanRoomHistory' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'clean-channel-history')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'cleanRoomHistory' });
		}

		const gt = inclusive ? '$gte' : '$gt';
		const lt = inclusive ? '$lte' : '$lt';

		const messagesToDelete = RocketChat.models.Messages.find({
			rid: roomId,
			ts: {
				[gt]: oldest,
				[lt]: latest
			}
		}, {
			fields: {
				file: 1,
				_id: 1
			},
			limit
		}).fetch().map(function(document) {
			if (document.file && document.file._id) {
				FileUpload.getStore('Uploads').deleteById(document.file._id);
			}

			return document._id;
		});

		const count = messagesToDelete.length;

		RocketChat.models.Messages.remove({
			_id: {
				$in: messagesToDelete
			}
		});

		RocketChat.Notifications.notifyLogged('deleteMessageBulk', {
			_id: {
				$in: messagesToDelete
			}
		});

		return count;
	}
});

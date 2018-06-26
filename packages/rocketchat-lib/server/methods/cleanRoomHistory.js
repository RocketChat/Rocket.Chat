/* globals FileUpload */

Meteor.methods({
	cleanRoomHistory({ roomId, latest, oldest, inclusive, limit, excludePinned, filesOnly }) {
		check(roomId, String);
		check(latest, Date);
		check(oldest, Date);
		check(inclusive, Boolean);
		check(limit, Match.Maybe(Number));
		check(excludePinned, Match.Maybe(Boolean));
		check(filesOnly, Match.Maybe(Boolean));

		if (!limit) {
			limit = 0;
		}
		if (!excludePinned) {
			excludePinned = false;
		}
		if (!filesOnly) {
			filesOnly = false;
		}

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cleanRoomHistory' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'clean-channel-history', roomId)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'cleanRoomHistory' });
		}

		const gt = inclusive ? '$gte' : '$gt';
		const lt = inclusive ? '$lte' : '$lt';

		let fileCount = 0;

		let messagesToDelete = RocketChat.models.Messages.find({
			rid: roomId,
			ts: {
				[gt]: oldest,
				[lt]: latest
			}
		}, {
			fields: {
				file: 1,
				pinned: 1,
				_id: 1
			},
			limit
		}).fetch().map(function(document) {
			if (document.file && document.file._id) {
				if (!excludePinned || !document.pinned) {
					FileUpload.getStore('Uploads').deleteById(document.file._id);
					fileCount++;

					if (filesOnly) {
						RocketChat.models.Messages.update({
							_id: document._id
						}, {
							$set: {
								file: null,
								attachments: [{
									color: '#F84040',
									text: '_File removed by prune_'
								}]
							}
						});
					}
				}
			}

			return document._id;
		});

		if (excludePinned) {
			messagesToDelete = messagesToDelete.filter(function(messageId) {
				const message = RocketChat.models.Messages.findOne({
					_id: messageId
				});

				return (message && !message.pinned);
			});
		}

		const count = messagesToDelete.length;

		if (!filesOnly) {
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
		}

		return filesOnly ? fileCount : count;
	}
});

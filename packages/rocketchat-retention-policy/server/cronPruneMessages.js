/* globals SyncedCron */

function getFinalPruneMode(room) {
	let hasPurge = false;

	if (room.retention && (room.retention.overrideGlobal || !RocketChat.settings.get('RetentionPolicy_Enabled'))) {
		hasPurge = room.retention.enabled;
	} else if (RocketChat.settings.get('RetentionPolicy_Enabled')) {
		if ((room && room.t === 'c') && RocketChat.settings.get('RetentionPolicy_AppliesToChannels')) {
			hasPurge = true;
		}
		if ((room && room.t === 'p') && RocketChat.settings.get('RetentionPolicy_AppliesToGroups')) {
			hasPurge = true;
		}
		if ((room && room.t === 'd') && RocketChat.settings.get('RetentionPolicy_AppliesToDMs')) {
			hasPurge = true;
		}
	}

	let filesOnly = RocketChat.settings.get('RetentionPolicy_FilesOnly');

	if (room.retention && room.retention.enabled && (room.retention.overrideGlobal || !room.retention.filesOnly || !RocketChat.settings.get('RetentionPolicy_Enabled'))) {
		filesOnly = room.retention.filesOnly;
	}

	let excludePinned = RocketChat.settings.get('RetentionPolicy_ExcludePinned');

	if (room.retention && room.retention.enabled && (room.retention.overrideGlobal || !room.retention.excludePinned || !RocketChat.settings.get('RetentionPolicy_Enabled'))) {
		excludePinned = room.retention.excludePinned;
	}

	let globalTimeout;

	if ((room && room.t === 'c')) {
		globalTimeout = RocketChat.settings.get('RetentionPolicy_MaxAge_Channels');
	}
	if ((room && room.t === 'p')) {
		globalTimeout = RocketChat.settings.get('RetentionPolicy_MaxAge_Groups');
	}
	if ((room && room.t === 'd')) {
		globalTimeout = RocketChat.settings.get('RetentionPolicy_MaxAge_DMs');
	}

	let maxAge = globalTimeout;

	if (room.retention && room.retention.enabled && (room.retention.overrideGlobal || !RocketChat.settings.get('RetentionPolicy_Enabled'))) {
		maxAge = room.retention.maxAge;
	} else if (room.retention && room.retention.enabled) {
		maxAge = Math.min(room.retention.maxAge, globalTimeout);
	}

	return {
		hasPurge,
		maxAge,
		excludePinned,
		filesOnly
	};
}

function processPruneMessages() {
	RocketChat.models.Rooms.find().forEach(function(room) {
		const properties = getFinalPruneMode(room);

		if (!properties.hasPurge) {
			return;
		}

		const now = new Date();
		const toDate = new Date(now.getTime() - properties.maxAge * 1000);
		const fromDate = new Date('0001-01-01T00:00:00Z');

		let messagesToDelete = RocketChat.models.Messages.find({
			rid: room._id,
			ts: {
				$gt: fromDate,
				$lt: toDate
			}
		}, {
			fields: {
				file: 1,
				pinned: 1,
				_id: 1
			}
		}).fetch().map(function(document) {
			if (document.file && document.file._id) {
				if (!properties.excludePinned || !document.pinned) {
					FileUpload.getStore('Uploads').deleteById(document.file._id);

					if (properties.filesOnly) {
						RocketChat.models.Messages.update({
							_id: document._id
						}, {
							$set: {
								file: null,
								attachments: [{
									color: '#F84040',
									text: '_File removed by automatic prune_'
								}]
							}
						});
					}
				}
			}

			return document._id;
		});

		if (properties.excludePinned) {
			messagesToDelete = messagesToDelete.filter(function(messageId) {
				const message = RocketChat.models.Messages.findOne({
					_id: messageId
				});

				return (message && !message.pinned);
			});
		}

		if (!properties.filesOnly) {
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
	});
}

Meteor.startup(function() {
	Meteor.defer(function() {
		processPruneMessages();

		SyncedCron.add({
			name: 'Prune old messages by retention policy',
			schedule: (parser) => parser.cron('* * * * * *', true),
			job: processPruneMessages
		});
	});
});

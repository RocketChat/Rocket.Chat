/* globals SyncedCron */

function roomHasPurge(room) {
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

	return hasPurge;
}

function roomFilesOnly(room) {
	let filesOnly = RocketChat.settings.get('RetentionPolicy_FilesOnly');

	if (room.retention && room.retention.enabled && (room.retention.overrideGlobal || !room.retention.filesOnly || !RocketChat.settings.get('RetentionPolicy_Enabled'))) {
		filesOnly = room.retention.filesOnly;
	}

	return filesOnly;
}

function roomExcludePinned(room) {
	let excludePinned = RocketChat.settings.get('RetentionPolicy_ExcludePinned');

	if (room.retention && room.retention.enabled && (room.retention.overrideGlobal || !room.retention.excludePinned || !RocketChat.settings.get('RetentionPolicy_Enabled'))) {
		excludePinned = room.retention.excludePinned;
	}

	return excludePinned;
}

function roomMaxAge(room) {
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

	return maxAge;
}

function getFinalPruneMode(room) {
	return {
		hasPurge: roomHasPurge(room),
		maxAge: roomMaxAge(room),
		excludePinned: roomExcludePinned(room),
		filesOnly: roomFilesOnly(room)
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
									color: '#FD745E',
									text: `_${ TAPi18n.__('File_removed_by_automatic_prune') }_`
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

function getSchedule(precision) {
	switch (precision ? precision : RocketChat.settings.get('RetentionPolicy_Precision')) {
		case '0':
			return '* * * * * *';
		case '1':
			return '*/10 * * * * *';
		case '2':
			return '0 * * * * *';
		case '3':
			return '0 */5 * * * *';
		case '4':
			return '0 */30 * * * *';
		case '5':
			return '0 0 * * * *';
		case '6':
			return '0 0 */6 * * *';
		case '7':
			return '0 0 0 * * *';
	}
}

const pruneCronName = 'Prune old messages by retention policy';

function deployCron(precision) {
	const schedule = getSchedule(precision);

	SyncedCron.remove(pruneCronName);
	SyncedCron.add({
		name: pruneCronName,
		schedule: (parser) => parser.cron(schedule, true),
		job: processPruneMessages
	});
}

Meteor.startup(function() {
	Meteor.defer(function() {
		processPruneMessages();
		deployCron();

		RocketChat.models.Settings.find({
			_id: 'RetentionPolicy_Precision'
		}).observe({
			changed(record) {
				deployCron(record.value);
			}
		});
	});
});

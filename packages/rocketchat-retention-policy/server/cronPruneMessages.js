/* globals SyncedCron */

function processPruneMessages() {
	if (!RocketChat.settings.get('RetentionPolicy_Enabled')) {
		console.log('Not pruning - disabled');
		return;
	}

	console.log('Pruning started');

	const allowedTypes = [];
	if (RocketChat.settings.get('RetentionPolicy_AppliesToChannels')) {
		allowedTypes.push('c');
	}
	if (RocketChat.settings.get('RetentionPolicy_AppliesToGroups')) {
		allowedTypes.push('p');
	}
	if (RocketChat.settings.get('RetentionPolicy_AppliesToDMs')) {
		allowedTypes.push('d');
	}

	const secondsAgo = RocketChat.settings.get('RetentionPolicy_MaxAge');
	const now = new Date();
	const toDate = new Date(now.getTime() - secondsAgo * 1000);
	const fromDate = new Date('0001-01-01T00:00:00Z');

	RocketChat.models.Rooms.find({
		t: {
			$in: allowedTypes
		}
	}).forEach(function(room) {
		console.log(`Pruning ${ room._id }`);

		const messagesToDelete = RocketChat.models.Messages.find({
			rid: room._id,
			ts: {
				$gt: fromDate,
				$lt: toDate
			}
		}, {
			fields: {
				file: 1,
				_id: 1
			}
		}).fetch().map(function(document) {
			if (document.file && document.file._id) {
				FileUpload.getStore('Uploads').deleteById(document.file._id);
			}

			return document._id;
		});

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

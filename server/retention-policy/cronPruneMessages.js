import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/littledata:synced-cron';

import { settings } from '../../app/settings';
import { Rooms, Settings } from '../../app/models';
import { cleanRoomHistory } from '../../app/lib';

let types = [];

const oldest = new Date('0001-01-01T00:00:00Z');


const maxTimes = {
	c: 0,
	p: 0,
	d: 0,
};

const toDays = (d) => d * 1000 * 60 * 60 * 24;

function job() {
	const now = new Date();
	const filesOnly = settings.get('RetentionPolicy_FilesOnly');
	const excludePinned = settings.get('RetentionPolicy_ExcludePinned');
	const ignoreDiscussion = settings.get('RetentionPolicy_DoNotExcludeDiscussion');

	// get all rooms with default values
	types.forEach((type) => {
		const maxAge = maxTimes[type] || 0;
		const latest = new Date(now.getTime() - toDays(maxAge));

		Rooms.find({
			t: type,
			$or: [
				{ 'retention.enabled': { $eq: true } },
				{ 'retention.enabled': { $exists: false } },
			],
			'retention.overrideGlobal': { $ne: true },
		}, { fields: { _id: 1 } }).forEach(({ _id: rid }) => {
			cleanRoomHistory({ rid, latest, oldest, filesOnly, excludePinned, ignoreDiscussion });
		});
	});

	Rooms.find({
		'retention.enabled': { $eq: true },
		'retention.overrideGlobal': { $eq: true },
		'retention.maxAge': { $gte: 0 },
	}).forEach((room) => {
		const { maxAge = 30, filesOnly, excludePinned } = room.retention;
		const latest = new Date(now.getTime() - toDays(maxAge));
		cleanRoomHistory({ rid: room._id, latest, oldest, filesOnly, excludePinned, ignoreDiscussion });
	});
}

function getSchedule(precision) {
	switch (precision) {
		case '0':
			return '0 */30 * * * *'; // 30 minutes
		case '1':
			return '0 0 * * * *'; // hour
		case '2':
			return '0 0 */6 * * *'; // 6 hours
		case '3':
			return '0 0 0 * * *'; // day
	}
}

const pruneCronName = 'Prune old messages by retention policy';

function deployCron(precision) {
	const schedule = (parser) => parser.cron(getSchedule(precision), true);

	SyncedCron.remove(pruneCronName);
	SyncedCron.add({
		name: pruneCronName,
		schedule,
		job,
	});
}

function reloadPolicy() {
	types = [];

	if (!settings.get('RetentionPolicy_Enabled')) {
		return SyncedCron.remove(pruneCronName);
	}
	if (settings.get('RetentionPolicy_AppliesToChannels')) {
		types.push('c');
	}

	if (settings.get('RetentionPolicy_AppliesToGroups')) {
		types.push('p');
	}

	if (settings.get('RetentionPolicy_AppliesToDMs')) {
		types.push('d');
	}

	maxTimes.c = settings.get('RetentionPolicy_MaxAge_Channels');
	maxTimes.p = settings.get('RetentionPolicy_MaxAge_Groups');
	maxTimes.d = settings.get('RetentionPolicy_MaxAge_DMs');

	return deployCron(settings.get('RetentionPolicy_Precision'));
}

Meteor.startup(function() {
	Meteor.defer(function() {
		Settings.find({
			_id: {
				$in: [
					'RetentionPolicy_Enabled',
					'RetentionPolicy_Precision',
					'RetentionPolicy_AppliesToChannels',
					'RetentionPolicy_AppliesToGroups',
					'RetentionPolicy_AppliesToDMs',
					'RetentionPolicy_MaxAge_Channels',
					'RetentionPolicy_MaxAge_Groups',
					'RetentionPolicy_MaxAge_DMs',
				],
			},
		}).observe({
			changed() {
				reloadPolicy();
			},
		});

		reloadPolicy();
	});
});

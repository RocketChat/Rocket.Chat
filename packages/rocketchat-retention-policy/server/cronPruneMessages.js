/* globals SyncedCron */

const types = [];

const oldest = new Date('0001-01-01T00:00:00Z');

const maxTimes = {
	c: 0,
	p: 0,
	d: 0
};

function job() {
	const now = new Date();
	const filesOnly = RocketChat.settings.get('RetentionPolicy_FilesOnly');
	const excludePinned = RocketChat.settings.get('RetentionPolicy_ExcludePinned');

	// get all rooms with default values
	types.forEach(type => {
		const maxAge = maxTimes[type] || 0;
		const latest = new Date(now.getTime() - maxAge * 1000);

		RocketChat.models.Rooms.find({
			t: type,
			$or: [{'retention.enabled': { $eq: true } }, { 'retention.enabled': { $exists: false } }],
			'retention.overrideGlobal': { $ne: true }
		}).forEach(({ _id: rid }) => {
			RocketChat.cleanRoomHistory({ rid, latest, oldest, filesOnly, excludePinned });
		});
	});

	RocketChat.models.Rooms.find({
		'retention.enabled': { $eq: true },
		'retention.overrideGlobal': { $eq: true },
		'retention.maxAge': { $gte: 0 }
	}).forEach(room => {
		const { maxAge = 0, filesOnly, excludePinned } = room.retention;
		const latest = new Date(now.getTime() - maxAge * 1000);
		RocketChat.cleanRoomHistory({ rid: room.rid, latest, oldest, filesOnly, excludePinned });
	});
}

function getSchedule(precision) {
	switch (precision) {
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
	const schedule = parser => parser.cron(getSchedule(precision), true);

	SyncedCron.remove(pruneCronName);
	SyncedCron.add({
		name: pruneCronName,
		schedule,
		job
	});
}

const removeItem = (arr, item) => {
	const index = arr.indexOf(item);
	return index > -1 && arr.splice(index, 1);
};

Meteor.startup(function() {
	Tracker.autorun(function() {
		if (!RocketChat.settings.get('RetentionPolicy_Enabled')) {
			return SyncedCron.remove(pruneCronName);
		}
		deployCron(RocketChat.settings.get('RetentionPolicy_Precision'));
	});


	Tracker.autorun(function() {
		const c = RocketChat.settings.get('RetentionPolicy_AppliesToChannels');
		if (c) {
			return types.push('c');
		}
		return removeItem(types, 'c');
	});
	Tracker.autorun(function() {
		const p = RocketChat.settings.get('RetentionPolicy_AppliesToGroups');
		if (p) {
			return types.push('p');
		}
		return removeItem(types, 'p');
	});
	Tracker.autorun(function() {
		const d = RocketChat.settings.get('RetentionPolicy_AppliesToDMs');
		if (d) {
			return types.push('d');
		}
		return removeItem(types, 'd');
	});

	Tracker.autorun(function() {
		maxTimes.c = RocketChat.settings.get('RetentionPolicy_MaxAge_Channels');
	});
	Tracker.autorun(function() {
		maxTimes.p = RocketChat.settings.get('RetentionPolicy_MaxAge_Groups');
	});
	Tracker.autorun(function() {
		maxTimes.d = RocketChat.settings.get('RetentionPolicy_MaxAge_DMs');
	});
});

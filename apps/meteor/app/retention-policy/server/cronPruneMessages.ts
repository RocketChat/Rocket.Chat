import { SyncedCron } from 'meteor/littledata:synced-cron';
import type { IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';

import { settings } from '../../settings/server';
import { Rooms } from '../../models/server';
import { cleanRoomHistory } from '../../lib/server';

const maxTimes = {
	c: 0,
	p: 0,
	d: 0,
};

let types: (keyof typeof maxTimes)[] = [];

const oldest = new Date('0001-01-01T00:00:00Z');

const toDays = (d: number): number => d * 1000 * 60 * 60 * 24;

function job(): void {
	const now = new Date();
	const filesOnly = settings.get<boolean>('RetentionPolicy_FilesOnly');
	const excludePinned = settings.get<boolean>('RetentionPolicy_DoNotPrunePinned');
	const ignoreDiscussion = settings.get<boolean>('RetentionPolicy_DoNotPruneDiscussion');
	const ignoreThreads = settings.get<boolean>('RetentionPolicy_DoNotPruneThreads');

	// get all rooms with default values
	types.forEach((type) => {
		const maxAge = maxTimes[type] || 0;
		const latest = new Date(now.getTime() - toDays(maxAge));

		Rooms.find(
			{
				't': type,
				'$or': [{ 'retention.enabled': { $eq: true } }, { 'retention.enabled': { $exists: false } }],
				'retention.overrideGlobal': { $ne: true },
			},
			{ fields: { _id: 1 } },
		).forEach(({ _id: rid }: IRoomWithRetentionPolicy) => {
			cleanRoomHistory({
				rid,
				latest,
				oldest,
				filesOnly,
				excludePinned,
				ignoreDiscussion,
				ignoreThreads,
			});
		});
	});

	Rooms.find({
		'retention.enabled': { $eq: true },
		'retention.overrideGlobal': { $eq: true },
		'retention.maxAge': { $gte: 0 },
	}).forEach((room: IRoomWithRetentionPolicy) => {
		const { maxAge = 30, filesOnly, excludePinned, ignoreThreads } = room.retention;
		const latest = new Date(now.getTime() - toDays(maxAge));
		cleanRoomHistory({
			rid: room._id,
			latest,
			oldest,
			filesOnly,
			excludePinned,
			ignoreDiscussion,
			ignoreThreads,
		});
	});
}

function getSchedule(precision: '0' | '1' | '2' | '3'): string {
	switch (precision) {
		case '0':
			return '*/30 * * * *'; // 30 minutes
		case '1':
			return '0 * * * *'; // hour
		case '2':
			return '0 */6 * * *'; // 6 hours
		case '3':
			return '0 0 * * *'; // day
	}
}

const pruneCronName = 'Prune old messages by retention policy';

function deployCron(precision: string): void {
	SyncedCron.remove(pruneCronName);

	SyncedCron.add({
		name: pruneCronName,
		schedule: (parser) => parser.cron(precision),
		job,
	});
}

settings.watchMultiple(
	[
		'RetentionPolicy_Enabled',
		'RetentionPolicy_AppliesToChannels',
		'RetentionPolicy_AppliesToGroups',
		'RetentionPolicy_AppliesToDMs',
		'RetentionPolicy_MaxAge_Channels',
		'RetentionPolicy_MaxAge_Groups',
		'RetentionPolicy_MaxAge_DMs',
		'RetentionPolicy_Advanced_Precision',
		'RetentionPolicy_Advanced_Precision_Cron',
		'RetentionPolicy_Precision',
	],
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

		const precision =
			(settings.get<boolean>('RetentionPolicy_Advanced_Precision') && settings.get<string>('RetentionPolicy_Advanced_Precision_Cron')) ||
			getSchedule(settings.get('RetentionPolicy_Precision'));

		return deployCron(precision);
	},
);

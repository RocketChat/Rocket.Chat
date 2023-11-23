import type { IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { Rooms } from '@rocket.chat/models';

import { cleanRoomHistory } from '../../lib/server/functions/cleanRoomHistory';
import { settings } from '../../settings/server';

const maxTimes = {
	c: 0,
	p: 0,
	d: 0,
};

let types: (keyof typeof maxTimes)[] = [];

const oldest = new Date('0001-01-01T00:00:00Z');

const toDays = (d: number): number => d * 1000 * 60 * 60 * 24;

async function job(): Promise<void> {
	const now = new Date();
	const filesOnly = settings.get<boolean>('RetentionPolicy_FilesOnly');
	const excludePinned = settings.get<boolean>('RetentionPolicy_DoNotPrunePinned');
	const ignoreDiscussion = settings.get<boolean>('RetentionPolicy_DoNotPruneDiscussion');
	const ignoreThreads = settings.get<boolean>('RetentionPolicy_DoNotPruneThreads');

	// get all rooms with default values
	for await (const type of types) {
		const maxAge = maxTimes[type] || 0;
		const latest = new Date(now.getTime() - toDays(maxAge));

		const rooms = await Rooms.find(
			{
				't': type,
				'$or': [{ 'retention.enabled': { $eq: true } }, { 'retention.enabled': { $exists: false } }],
				'retention.overrideGlobal': { $ne: true },
			},
			{ projection: { _id: 1 } },
		).toArray();

		for await (const { _id: rid } of rooms) {
			await cleanRoomHistory({
				rid,
				latest,
				oldest,
				filesOnly,
				excludePinned,
				ignoreDiscussion,
				ignoreThreads,
			});
		}
	}

	const rooms = await Rooms.find<IRoomWithRetentionPolicy>(
		{
			'retention.enabled': { $eq: true },
			'retention.overrideGlobal': { $eq: true },
			'retention.maxAge': { $gte: 0 },
		},
		{ projection: { _id: 1, retention: 1 } },
	).toArray();

	for await (const { _id: rid, retention } of rooms) {
		const { maxAge = 30, filesOnly, excludePinned, ignoreThreads } = retention;
		const latest = new Date(now.getTime() - toDays(maxAge));
		await cleanRoomHistory({
			rid,
			latest,
			oldest,
			filesOnly,
			excludePinned,
			ignoreDiscussion,
			ignoreThreads,
		});
	}
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

async function deployCron(precision: string): Promise<void> {
	if (await cronJobs.has(pruneCronName)) {
		await cronJobs.remove(pruneCronName);
	}
	await cronJobs.add(pruneCronName, precision, async () => job());
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
	async function reloadPolicy() {
		types = [];

		if (!settings.get('RetentionPolicy_Enabled')) {
			return cronJobs.remove(pruneCronName);
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

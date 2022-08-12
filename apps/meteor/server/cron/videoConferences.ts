import type { SyncedCron } from 'meteor/littledata:synced-cron';
import type { VideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { VideoConference as VideoConferenceModel } from '@rocket.chat/models';

import { VideoConf } from '../sdk';

// 24 hours
const VIDEO_CONFERENCE_TTL = 24 * 60 * 60 * 1000;

async function runVideoConferences(): Promise<void> {
	const minimum = new Date(new Date().valueOf() - VIDEO_CONFERENCE_TTL);

	const calls = await (await VideoConferenceModel.findAllLongRunning(minimum))
		.map(({ _id: callId }: Pick<VideoConference, '_id'>) => callId)
		.toArray();

	await Promise.all(calls.map((callId) => VideoConf.setStatus(callId, VideoConferenceStatus.EXPIRED)));
}

export function videoConferencesCron(syncedCron: typeof SyncedCron): void {
	runVideoConferences();

	syncedCron.add({
		name: 'VideoConferences',
		schedule(parser: any) {
			return parser.cron('0 */3 * * *');
		},
		job: runVideoConferences,
	});
}

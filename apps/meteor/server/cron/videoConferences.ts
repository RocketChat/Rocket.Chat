import type { SyncedCron } from 'meteor/littledata:synced-cron';
import { VideoConference } from '@rocket.chat/models';

// 24 hours
const VIDEO_CONFERENCE_TTL = 24 * 60 * 60 * 1000;

async function runVideoConferences(): Promise<void> {
	const minimum = new Date(new Date().valueOf() - VIDEO_CONFERENCE_TTL);

	return VideoConference.expireOldVideoConferences(minimum);
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

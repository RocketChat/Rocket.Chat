import { VideoConf } from '@rocket.chat/core-services';
import type { VideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { VideoConference as VideoConferenceModel } from '@rocket.chat/models';

import { isPresenceSweepDue } from '../../lib/videoConference/presence';

// 24 hours
const VIDEO_CONFERENCE_TTL = 24 * 60 * 60 * 1000;

async function runVideoConferences(): Promise<void> {
	const minimum = new Date(new Date().valueOf() - VIDEO_CONFERENCE_TTL);

	const calls = await (await VideoConferenceModel.findAllLongRunning(minimum))
		.map(({ _id: callId }: Pick<VideoConference, '_id'>) => callId)
		.toArray();

	await Promise.all(calls.map((callId) => VideoConf.setStatus(callId, VideoConferenceStatus.EXPIRED)));
}

/** Treats everyone whose call window has stopped renewing its lease as having left. */
async function runPresenceSweep(readyForMs: number): Promise<void> {
	// Measured from registration rather than process launch: a slow boot can eat the whole lease before any
	// client has had a chance to heartbeat.
	if (!isPresenceSweepDue(readyForMs)) {
		return;
	}

	await VideoConf.expirePresenceLeases();
}

export async function videoConferencesCron(): Promise<void> {
	void runVideoConferences();

	await cronJobs.add('VideoConferences', '0 */3 * * *', async () => runVideoConferences());

	// Monotonic, not the wall clock: a clock correction must not be able to age the process past the grace
	// period in an instant, or hold it under one forever.
	const registeredAt = performance.now();
	return cronJobs.add('VideoConferencePresence', '* * * * *', async () => runPresenceSweep(performance.now() - registeredAt));
}

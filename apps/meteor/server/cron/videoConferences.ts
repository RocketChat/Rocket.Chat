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

/**
 * Sweeps presence leases: everyone whose call window has stopped renewing is treated as having left.
 *
 * Frequent because it is what recovers a call after an outage, and cheap because the work is proportional to the
 * number of *open* calls, which is normally none.
 */
async function runPresenceSweep(readyForMs: number): Promise<void> {
	// A restart cannot tell "everyone left" from "we were not here to be told" — both leave every lease expired.
	// So a fresh process waits out one full lease, by which time anyone still in a call has renewed theirs.
	// Measured from when the job was registered, not from process launch: a slow boot can eat the whole lease
	// before any client had a chance to heartbeat.
	if (!isPresenceSweepDue(readyForMs)) {
		return;
	}

	await VideoConf.expirePresenceLeases();
}

export async function videoConferencesCron(): Promise<void> {
	void runVideoConferences();

	await cronJobs.add('VideoConferences', '0 */3 * * *', async () => runVideoConferences());

	// A cron expression, not an interval phrase: the scheduler parses these, and an unparseable schedule leaves
	// `nextRunAt` on the moment it just ran — which is a job that re-runs on every scheduler tick forever.
	//
	// Not run here on the way past, unlike the expiry above: at startup the guard inside it would reject it
	// anyway, and that is exactly the point.
	//
	// Monotonic time, not the wall clock: an NTP correction or a manual clock change must not be able to age the
	// process past the grace period in an instant — or hold it forever under it.
	const registeredAt = performance.now();
	return cronJobs.add('VideoConferencePresence', '* * * * *', async () => runPresenceSweep(performance.now() - registeredAt));
}

import { VideoConf } from '@rocket.chat/core-services';
import type { VideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { VideoConference as VideoConferenceModel } from '@rocket.chat/models';

// 24 hours
const VIDEO_CONFERENCE_TTL = 24 * 60 * 60 * 1000;

async function runVideoConferences(): Promise<void> {
	const minimum = new Date(new Date().valueOf() - VIDEO_CONFERENCE_TTL);

	const calls = await (await VideoConferenceModel.findAllLongRunning(minimum))
		.map(({ _id: callId }: Pick<VideoConference, '_id'>) => callId)
		.toArray();

	await Promise.all(calls.map((callId) => VideoConf.setStatus(callId, VideoConferenceStatus.EXPIRED)));
}

export async function videoConferencesCron(): Promise<void> {
	void runVideoConferences();

	return cronJobs.add('VideoConferences', '0 */3 * * *', async () => runVideoConferences());
}

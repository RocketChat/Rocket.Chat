import type { Serialized, VideoConference } from '@rocket.chat/core-typings';

import { mapVideoConfUserFromApi } from './mapVideoConfUserFromApi';

/**
 * REST hands every date over as an ISO string; the in-memory model uses `Date`. Reifying here is what lets
 * every consumer rely on date methods rather than each one remembering which fields are strings.
 *
 * The native provider's own records — who was in the call, what was recorded, transcribed and summarised —
 * are dated the same way, so they are reified alongside rather than by whoever happens to read them.
 */
export const mapVideoConfFromApi = (videoConf: Serialized<VideoConference>): VideoConference =>
	({
		...videoConf,
		_updatedAt: new Date(videoConf._updatedAt),
		createdAt: new Date(videoConf.createdAt),
		endedAt: videoConf.endedAt ? new Date(videoConf.endedAt) : undefined,
		users: videoConf.users.map(mapVideoConfUserFromApi),
		...(videoConf.participants && {
			participants: videoConf.participants.map((participant) => ({
				...participant,
				joinedAt: participant.joinedAt ? new Date(participant.joinedAt) : undefined,
				leftAt: participant.leftAt ? new Date(participant.leftAt) : undefined,
			})),
		}),
		...(videoConf.recording && {
			recording: {
				...videoConf.recording,
				startedAt: new Date(videoConf.recording.startedAt),
				endedAt: videoConf.recording.endedAt ? new Date(videoConf.recording.endedAt) : undefined,
			},
		}),
		...(videoConf.transcription && {
			transcription: {
				...videoConf.transcription,
				startedAt: videoConf.transcription.startedAt ? new Date(videoConf.transcription.startedAt) : undefined,
				endedAt: videoConf.transcription.endedAt ? new Date(videoConf.transcription.endedAt) : undefined,
			},
		}),
		...(videoConf.transcript && {
			transcript: videoConf.transcript.map((entry) => ({
				...entry,
				startedAt: new Date(entry.startedAt),
				endedAt: entry.endedAt ? new Date(entry.endedAt) : undefined,
			})),
		}),
		...(videoConf.summary && { summary: { ...videoConf.summary, generatedAt: new Date(videoConf.summary.generatedAt) } }),
	}) as VideoConference;

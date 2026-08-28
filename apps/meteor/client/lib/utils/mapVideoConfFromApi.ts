import type { Serialized, VideoConference } from '@rocket.chat/core-typings';

import { mapVideoConfUserFromApi } from './mapVideoConfUserFromApi';

/**
 * REST hands every date over as an ISO string; the in-memory model uses `Date`. Reifying here is what lets
 * every consumer rely on date methods rather than each one remembering which fields are strings.
 */
export const mapVideoConfFromApi = (videoConf: Serialized<VideoConference>): VideoConference =>
	({
		...videoConf,
		_updatedAt: new Date(videoConf._updatedAt),
		createdAt: new Date(videoConf.createdAt),
		...(videoConf.endedAt && { endedAt: new Date(videoConf.endedAt) }),
		users: videoConf.users.map(mapVideoConfUserFromApi),
	}) as VideoConference;

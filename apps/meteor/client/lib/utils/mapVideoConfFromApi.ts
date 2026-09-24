import type { Serialized, VideoConferenceWithDiscussion } from '@rocket.chat/core-typings';

import { mapMessageFromApi } from './mapMessageFromApi';
import { mapVideoConfUserFromApi } from './mapVideoConfUserFromApi';

/**
 * REST hands every date over as an ISO string; the in-memory model uses `Date`. Reifying here is what lets
 * every consumer rely on date methods rather than each one remembering which fields are strings.
 */
export const mapVideoConfFromApi = (videoConf: Serialized<VideoConferenceWithDiscussion>): VideoConferenceWithDiscussion =>
	({
		...videoConf,
		_updatedAt: new Date(videoConf._updatedAt),
		createdAt: new Date(videoConf.createdAt),
		...(videoConf.endedAt && { endedAt: new Date(videoConf.endedAt) }),
		...(videoConf.discussionLastMessage && { discussionLastMessage: mapMessageFromApi(videoConf.discussionLastMessage) }),
		users: videoConf.users.map(mapVideoConfUserFromApi),
	}) as VideoConferenceWithDiscussion;

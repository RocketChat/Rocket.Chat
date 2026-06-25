import type { IRoom, Serialized } from '@rocket.chat/core-typings';

import { mapMessageFromApi } from './mapMessageFromApi';

export const mapRoomFromApi = ({
	_updatedAt,
	lm,
	ts,
	lastMessage,
	webRtcCallStartTime,
	usersWaitingForE2EKeys,
	...room
}: Serialized<IRoom>): IRoom => ({
	...room,
	_updatedAt: new Date(_updatedAt),
	...(lm && { lm: new Date(lm) }),
	...(ts && { ts: new Date(ts) }),
	...(lastMessage && { lastMessage: mapMessageFromApi(lastMessage) }),
	...(webRtcCallStartTime && { webRtcCallStartTime: new Date(webRtcCallStartTime) }),
	...(usersWaitingForE2EKeys && {
		usersWaitingForE2EKeys: usersWaitingForE2EKeys.map((user) => ({ ...user, ts: new Date(user.ts) })),
	}),
});

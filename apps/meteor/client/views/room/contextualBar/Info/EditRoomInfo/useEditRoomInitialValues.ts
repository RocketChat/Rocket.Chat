import type { IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import { useRetentionPolicy } from '../../../hooks/useRetentionPolicy';

export const useEditRoomInitialValues = (room: IRoomWithRetentionPolicy) => {
	const retentionPolicy = useRetentionPolicy(room);
	const { t, ro, archived, topic, description, announcement, joinCodeRequired, sysMes, encrypted, retention, reactWhenReadOnly } = room;

	return useMemo(
		() => ({
			roomName: t === 'd' && room.usernames ? room.usernames.join(' x ') : roomCoordinator.getRoomName(t, room),
			roomType: t,
			readOnly: !!ro,
			reactWhenReadOnly,
			archived: !!archived,
			roomTopic: topic ?? '',
			roomDescription: description ?? '',
			roomAnnouncement: announcement ?? '',
			roomAvatar: undefined,
			joinCode: '',
			joinCodeRequired: !!joinCodeRequired,
			systemMessages: Array.isArray(sysMes) ? sysMes : [],
			hideSysMes: Array.isArray(sysMes) ? !!sysMes?.length : !!sysMes,
			encrypted,
			...(retentionPolicy?.enabled && {
				retentionEnabled: retention?.enabled ?? retentionPolicy.isActive,
				retentionOverrideGlobal: !!retention?.overrideGlobal,
				retentionMaxAge: retention?.maxAge ?? retentionPolicy.maxAge,
				retentionExcludePinned: retention?.excludePinned ?? retentionPolicy.excludePinned,
				retentionFilesOnly: retention?.filesOnly ?? retentionPolicy.filesOnly,
			}),
		}),
		[
			announcement,
			archived,
			description,
			joinCodeRequired,
			retention,
			retentionPolicy,
			ro,
			room,
			sysMes,
			t,
			topic,
			encrypted,
			reactWhenReadOnly,
		],
	);
};

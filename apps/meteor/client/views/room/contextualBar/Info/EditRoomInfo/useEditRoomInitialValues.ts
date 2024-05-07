import type { IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';

const getPolicyRoomType = (roomType: IRoomWithRetentionPolicy['t']) => {
	switch (roomType) {
		case 'c':
			return 'Channels';
		case 'p':
			return 'Groups';
		case 'd':
			return 'DMs';
	}
};

export const useEditRoomInitialValues = (room: IRoomWithRetentionPolicy) => {
	const { t, ro, archived, topic, description, announcement, joinCodeRequired, sysMes, encrypted, retention, reactWhenReadOnly } = room;

	const retentionPolicyEnabled = useSetting('RetentionPolicy_Enabled');
	const maxAgeDefault = useSetting<number>(`RetentionPolicy_MaxAge_${getPolicyRoomType(room.t)}`) || 30;
	const retentionEnabledDefault = useSetting<boolean>(`RetentionPolicy_AppliesTo${getPolicyRoomType(room.t)}`);
	const excludePinnedDefault = useSetting('RetentionPolicy_DoNotPrunePinned');
	const filesOnlyDefault = useSetting('RetentionPolicy_FilesOnly');

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
			...(retentionPolicyEnabled && {
				retentionEnabled: retention?.enabled ?? retentionEnabledDefault,
				retentionOverrideGlobal: !!retention?.overrideGlobal,
				retentionMaxAge: Math.min(retention?.maxAge, maxAgeDefault) || maxAgeDefault,
				retentionExcludePinned: retention?.excludePinned ?? excludePinnedDefault,
				retentionFilesOnly: retention?.filesOnly ?? filesOnlyDefault,
			}),
		}),
		[
			announcement,
			archived,
			description,
			excludePinnedDefault,
			filesOnlyDefault,
			joinCodeRequired,
			maxAgeDefault,
			retention,
			retentionEnabledDefault,
			retentionPolicyEnabled,
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

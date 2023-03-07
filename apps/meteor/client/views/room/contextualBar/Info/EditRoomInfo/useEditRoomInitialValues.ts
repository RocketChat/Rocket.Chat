import type { IRoom, IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';

const typeMap = {
	c: 'Channels',
	p: 'Groups',
	d: 'DMs',
};

export const useEditRoomInitialValues = (room: IRoom | IRoomWithRetentionPolicy, settings) => {
	const {
		t,
		ro,
		archived,
		topic,
		description,
		announcement,
		joinCodeRequired,
		sysMes,
		encrypted,
		retention = {},
		reactWhenReadOnly,
	} = room;

	const { retentionPolicyEnabled, maxAgeDefault } = settings;

	const retentionEnabledDefault = useSetting(`RetentionPolicy_AppliesTo${typeMap[room.t]}`);
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
			hideSysMes: !!sysMes?.length,
			encrypted,
			...(retentionPolicyEnabled && {
				retentionEnabled: retention.enabled ?? retentionEnabledDefault,
				retentionOverrideGlobal: !!retention.overrideGlobal,
				retentionMaxAge: Math.min(retention.maxAge, maxAgeDefault) || maxAgeDefault,
				retentionExcludePinned: retention.excludePinned ?? excludePinnedDefault,
				retentionFilesOnly: retention.filesOnly ?? filesOnlyDefault,
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
			retention.enabled,
			retention.excludePinned,
			retention.filesOnly,
			retention.maxAge,
			retention.overrideGlobal,
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

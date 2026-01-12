import { isRoomFederated } from '@rocket.chat/core-typings';
import { useUserAvatarPath, useUserId } from '@rocket.chat/ui-contexts';
import type { TranslationKey, RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import type { PeerInfo } from '@rocket.chat/ui-voip';
import { useMediaCallAction } from '@rocket.chat/ui-voip';
import { useMemo } from 'react';

import { useRoom, useRoomSubscription } from '../../views/room/contexts/RoomContext';
import { useUserInfoQuery } from '../useUserInfoQuery';

const getPeerId = (uids: string[], ownUserId: string | undefined) => {
	if (!ownUserId) {
		return undefined;
	}

	const otherIds = uids.filter((uid) => uid !== ownUserId);

	// If no id, it's an one user DM. If more than one, it's a group dm. Both are not supported as of now.
	if (otherIds.length === 0 || otherIds.length > 1) {
		return undefined;
	}

	return otherIds[0];
};

export const useMediaCallRoomAction = () => {
	const room = useRoom();
	const { uids = [] } = room;
	const subscription = useRoomSubscription();
	const ownUserId = useUserId();
	const federated = isRoomFederated(room);

	const getAvatarUrl = useUserAvatarPath();

	const peerId = getPeerId(uids, ownUserId);

	const { data } = useUserInfoQuery({ userId: peerId as string }, { enabled: !!peerId });

	const peerInfo = useMemo<PeerInfo | undefined>(() => {
		if (!data?.user?._id) {
			return undefined;
		}

		return {
			userId: data.user._id,
			displayName: data.user.name || data.user.username || '',
			avatarUrl: data.user.username
				? getAvatarUrl({ username: data.user.username, etag: data.user.avatarETag })
				: getAvatarUrl({ userId: data.user._id }),
		};
	}, [data, getAvatarUrl]);

	const callAction = useMediaCallAction(peerInfo);

	const blocked = subscription?.blocked || subscription?.blocker;

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!peerId || !callAction || blocked || federated) {
			return undefined;
		}

		const { action, title, icon } = callAction;

		return {
			id: 'start-voice-call',
			title: title as TranslationKey,
			icon,
			featured: true,
			action: () => action(),
			groups: ['direct'] as const,
		};
	}, [peerId, callAction, blocked, federated]);
};

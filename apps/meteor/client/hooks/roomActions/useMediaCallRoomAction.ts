import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useUserAvatarPath, useUserId } from '@rocket.chat/ui-contexts';
import { useMediaCallAction } from '@rocket.chat/ui-voip';
import { useMemo } from 'react';

import { useRoom } from '../../views/room/contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';
import { useUserInfoQuery } from '../useUserInfoQuery';

const getPeerId = (uids: string[], ownUserId: string | null) => {
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
	const { uids = [] } = useRoom();
	const ownUserId = useUserId();

	const getAvatarUrl = useUserAvatarPath();

	const peerId = getPeerId(uids, ownUserId);

	const { data: peerInfo } = useUserInfoQuery({ userId: peerId as string }, { enabled: !!peerId });

	const { action, title, icon } = useMediaCallAction(true);

	// TODO: Implement hangup call
	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!peerId) {
			return undefined;
		}

		return {
			id: 'start-voice-call',
			title: title as TranslationKey,
			icon,
			featured: true,
			action: () => {
				const { user } = peerInfo || {};

				if (user) {
					const avatarUrl = user.username
						? getAvatarUrl({ username: user.username, etag: user.avatarETag })
						: getAvatarUrl({ userId: peerId });

					return action({
						userId: peerId,
						displayName: user.name || user.username || '',
						avatarUrl,
					});
				}

				return action();
			},
			groups: ['direct'] as const,
		};
	}, [peerId, title, icon, peerInfo, action, getAvatarUrl]);
};

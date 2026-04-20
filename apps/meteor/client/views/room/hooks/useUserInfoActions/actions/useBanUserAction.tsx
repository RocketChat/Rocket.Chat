import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { usePermission, useUserRoom, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import { useBanUser } from '../../useBanUser';
import type { UserInfoAction } from '../useUserInfoActions';

export const useBanUserAction = (user: Pick<IUser, '_id' | 'username'>, roomId: IRoom['_id']): UserInfoAction | undefined => {
	const { t } = useTranslation();

	const room = useUserRoom(roomId);
	const subscription = useUserSubscription(roomId);

	if (!room) {
		throw new Error('error-invalid-room');
	}

	if (!user.username) {
		throw new Error('error-invalid-username');
	}

	const { _id: uid, username } = user;
	const hasPermissionToBan = usePermission('ban-user', roomId);

	const { roomCanBan } = getRoomDirectives({ room, showingUserId: uid, userSubscription: subscription });

	const handleBan = useBanUser({ roomId });

	return useMemo(() => {
		if (!hasPermissionToBan || !roomCanBan) {
			return undefined;
		}

		return {
			content: t('Ban_user_from_room'),
			icon: 'ban' as const,
			onClick: () => handleBan(username),
			type: 'moderation' as const,
			variant: 'danger' as const,
		};
	}, [handleBan, roomCanBan, hasPermissionToBan, t, username]);
};

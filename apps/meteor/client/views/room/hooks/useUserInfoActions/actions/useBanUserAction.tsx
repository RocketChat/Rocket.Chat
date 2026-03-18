import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isRoomFederated, isRoomNativeFederated } from '@rocket.chat/core-typings';
import { usePermission, useUser, useUserRoom, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import * as Federation from '../../../../../lib/federation/Federation';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import { useBanUser } from '../../useBanUser';
import type { UserInfoAction } from '../useUserInfoActions';

export const useBanUserAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): UserInfoAction | undefined => {
	const { t } = useTranslation();

	const currentUser = useUser();
	const room = useUserRoom(rid);
	const subscription = useUserSubscription(rid);

	if (!room) {
		throw new Error('error-invalid-room');
	}

	if (!user.username) {
		throw new Error('error-invalid-username');
	}

	const { _id: uid, username } = user;
	const hasPermissionToBan = usePermission('ban-user', rid);

	const userCanBan = isRoomFederated(room)
		? isRoomNativeFederated(room) && Federation.isEditableByTheUser(currentUser || undefined, room, subscription)
		: hasPermissionToBan;

	const { roomCanBan } = getRoomDirectives({ room, showingUserId: uid, userSubscription: subscription });

	const handleBan = useBanUser({ roomId: rid });

	return useMemo(() => {
		if (!userCanBan || !roomCanBan) {
			return undefined;
		}

		return {
			content: t('Ban_user_from_room'),
			icon: 'ban' as const,
			onClick: () => handleBan(username),
			type: 'moderation' as const,
			variant: 'danger' as const,
		};
	}, [handleBan, roomCanBan, userCanBan, t, username]);
};

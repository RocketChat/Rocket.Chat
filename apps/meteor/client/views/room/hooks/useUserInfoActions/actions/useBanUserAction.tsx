import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isRoomFederated, isRoomNativeFederated } from '@rocket.chat/core-typings';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { GenericModal } from '@rocket.chat/ui-client';
import { usePermission, useSetModal, useToastMessageDispatch, useUser, useUserRoom, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointMutation } from '../../../../../hooks/useEndpointMutation';
import * as Federation from '../../../../../lib/federation/Federation';
import { roomsQueryKeys } from '../../../../../lib/queryKeys';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import type { UserInfoAction } from '../useUserInfoActions';

export const useBanUserAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): UserInfoAction | undefined => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const currentUser = useUser();
	const room = useUserRoom(rid);
	const subscription = useUserSubscription(rid);
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

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

	const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));
	const { roomCanBan } = getRoomDirectives({ room, showingUserId: uid, userSubscription: subscription });

	const { mutate: banUser, isPending } = useEndpointMutation('POST', '/v1/rooms.banUser', {
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('User__username__banned_from__roomName__', { username, roomName }) });
			void queryClient.invalidateQueries({ queryKey: roomsQueryKeys.members(room._id, room.t) });
			void queryClient.invalidateQueries({ queryKey: roomsQueryKeys.bannedUsers(room._id) });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			setModal(null);
		},
	});

	const onConfirm = useCallback(() => {
		banUser({ roomId: rid, username });
	}, [banUser, rid, username]);

	const handleBan = useCallback(() => {
		setModal(
			<GenericModal
				variant='danger'
				title={t('Are_you_sure')}
				confirmText={t('Yes_ban_user')}
				confirmLoading={isPending}
				onClose={() => setModal(null)}
				onCancel={() => setModal(null)}
				onConfirm={onConfirm}
			>
				{t('The_user_will_be_banned_from__roomName__', { roomName })}
			</GenericModal>,
		);
	}, [setModal, t, isPending, onConfirm, roomName]);

	return useMemo(() => {
		if (!userCanBan || !roomCanBan) {
			return undefined;
		}

		return {
			content: t('Ban_user_from_room'),
			icon: 'ban' as const,
			onClick: handleBan,
			type: 'moderation' as const,
			variant: 'danger' as const,
		};
	}, [handleBan, roomCanBan, userCanBan, t]);
};

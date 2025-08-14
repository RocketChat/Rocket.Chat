import type { IRoom, IUser, Serialized } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { GenericModal } from '@rocket.chat/ui-client';
import {
	usePermission,
	useSetModal,
	useToastMessageDispatch,
	useTranslation,
	useUser,
	useUserRoom,
	useUserSubscription,
} from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useEndpointMutation } from '../../../../../hooks/useEndpointMutation';
import * as Federation from '../../../../../lib/federation/Federation';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import RemoveUsersModal from '../../../../teams/contextualBar/members/RemoveUsersModal';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import type { UserInfoAction } from '../useUserInfoActions';

export const useRemoveUserAction = (
	user: Pick<IUser, '_id' | 'username'>,
	rid: IRoom['_id'],
	reload?: () => void,
): UserInfoAction | undefined => {
	const room = useUserRoom(rid);

	if (!room) {
		throw Error('Room not provided');
	}

	const t = useTranslation();
	const currentUser = useUser();
	const subscription = useUserSubscription(rid);

	const { _id: uid } = user;

	const hasPermissionToRemove = usePermission('remove-user', rid);
	const userCanRemove = isRoomFederated(room)
		? Federation.isEditableByTheUser(currentUser || undefined, room, subscription)
		: hasPermissionToRemove;
	const setModal = useSetModal();
	const closeModal = useEffectEvent(() => setModal(null));
	const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));

	const { roomCanRemove } = getRoomDirectives({ room, showingUserId: uid, userSubscription: subscription });

	const dispatchToastMessage = useToastMessageDispatch();

	const { mutateAsync: removeFromTeam } = useEndpointMutation('POST', '/v1/teams.removeMember', {
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('User_has_been_removed_from_team') });
		},
		onSettled: () => {
			closeModal();
			reload?.();
		},
	});

	const removeFromRoomEndpoint = room.t === 'p' ? '/v1/groups.kick' : '/v1/channels.kick';
	const { mutateAsync: removeFromRoom } = useEndpointMutation('POST', removeFromRoomEndpoint, {
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('User_has_been_removed_from_s', roomName) });
		},
		onSettled: () => {
			closeModal();
			reload?.();
		},
	});

	const removeUserOptionAction = useEffectEvent(() => {
		const handleRemoveFromTeam = async (rooms: Record<string, Serialized<IRoom>>) => {
			if (room.teamId) {
				const roomKeys = Object.keys(rooms);
				await removeFromTeam({
					teamId: room.teamId,
					userId: uid,
					...(roomKeys.length && { rooms: roomKeys }),
				});
			}
		};

		const handleRemoveFromRoom = async (rid: IRoom['_id'], uid: IUser['_id']) => {
			await removeFromRoom({ roomId: rid, userId: uid });
		};

		if (room.teamMain && room.teamId) {
			return setModal(
				<RemoveUsersModal teamId={room?.teamId} userId={uid} onClose={closeModal} onCancel={closeModal} onConfirm={handleRemoveFromTeam} />,
			);
		}

		setModal(
			<GenericModal
				variant='danger'
				confirmText={t('Yes_remove_user')}
				onClose={closeModal}
				onCancel={closeModal}
				onConfirm={(): Promise<void> => handleRemoveFromRoom(rid, uid)}
			>
				{t('The_user_will_be_removed_from_s', roomName)}
			</GenericModal>,
		);
	});

	const removeUserOption = useMemo(
		() =>
			roomCanRemove && userCanRemove
				? {
						content: room?.teamMain ? t('Remove_from_team') : t('Remove_from_room'),
						icon: 'cross' as const,
						onClick: removeUserOptionAction,
						type: 'moderation' as const,
						variant: 'danger' as const,
					}
				: undefined,
		[room, roomCanRemove, userCanRemove, removeUserOptionAction, t],
	);

	return removeUserOption;
};

import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { GenericModal } from '@rocket.chat/ui-client';
import {
	useTranslation,
	usePermission,
	useUserRoom,
	useUserSubscription,
	useSetModal,
	useUser,
	useToastMessageDispatch,
	useEndpoint,
} from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useCallback, useMemo } from 'react';

import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import { useUserHasRoomRole } from '../../useUserHasRoomRole';
import type { UserInfoAction, UserInfoActionType } from '../useUserInfoActions';

const getWarningModalForFederatedRooms = (
	closeModalFn: () => void,
	handleConfirmFn: () => void,
	title: string,
	confirmText: string,
	bodyText: string,
): ReactElement => (
	<GenericModal
		variant='warning'
		onClose={closeModalFn}
		onConfirm={handleConfirmFn}
		onCancel={closeModalFn}
		title={title}
		confirmText={confirmText}
	>
		{bodyText}
	</GenericModal>
);

const getEndpoint = (roomType: string, isOwner: boolean) => {
	if (roomType === 'p') {
		return isOwner ? '/v1/groups.removeOwner' : '/v1/groups.addOwner';
	}
	return isOwner ? '/v1/channels.removeOwner' : '/v1/channels.addOwner';
};

export const useChangeOwnerAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): UserInfoAction | undefined => {
	const t = useTranslation();
	const room = useUserRoom(rid);
	const { _id: uid, username } = user;
	const userCanSetOwner = usePermission('set-owner', rid);
	const hasManageRemotely = usePermission('manage-room-members-remotely');
	const isOwner = useUserHasRoomRole(uid, rid, 'owner');
	const userSubscription = useUserSubscription(rid);
	const setModal = useSetModal();
	const { _id: loggedUserId = '' } = useUser() || {};
	const loggedUserIsOwner = useUserHasRoomRole(loggedUserId, rid, 'owner');
	const dispatchToastMessage = useToastMessageDispatch();

	// Move all hooks before the conditional return
	const toggleOwnerEndpoint = useEndpoint('POST', room?.t ? getEndpoint(room.t, isOwner) : '/v1/channels.addOwner');

	const toggleOwnerMutation = useMutation({
		mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => {
			await toggleOwnerEndpoint({ roomId, userId });
			const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));
			return t(isOwner ? 'User__username__removed_from__room_name__owners' : 'User__username__is_now_an_owner_of__room_name_', {
				username,
				room_name: roomName,
			});
		},
		onSuccess: (message) => {
			dispatchToastMessage({ type: 'success', message });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleChangeOwner = useCallback(() => {
		if (!room || !isRoomFederated(room)) {
			return toggleOwnerMutation.mutateAsync({ roomId: rid, userId: uid });
		}

		const changingOwnRole = uid === loggedUserId;

		const closeModal = () => {
			setModal(null);
		};

		const handleConfirm = () => {
			toggleOwnerMutation.mutateAsync({ roomId: rid, userId: uid });
			closeModal();
		};

		if (changingOwnRole && loggedUserIsOwner) {
			return setModal(
				getWarningModalForFederatedRooms(
					closeModal,
					handleConfirm,
					t('Federation_Matrix_losing_privileges'),
					t('Yes_continue'),
					t('Federation_Matrix_losing_privileges_warning'),
				),
			);
		}

		if (!changingOwnRole && loggedUserIsOwner) {
			return setModal(
				getWarningModalForFederatedRooms(
					closeModal,
					handleConfirm,
					t('Warning'),
					t('Yes_continue'),
					t('Federation_Matrix_giving_same_permission_warning'),
				),
			);
		}

		toggleOwnerMutation.mutateAsync({ roomId: rid, userId: uid });
	}, [room, loggedUserId, loggedUserIsOwner, toggleOwnerMutation, rid, uid, t, setModal]);

	const changeOwnerAction = useEffectEvent(async () => handleChangeOwner());

	const changeOwnerOption = useMemo(() => {
		// If room is not yet available (admin modal initial render), do not throw; simply hide action
		if (!room) {
			return undefined;
		}

		const { roomCanSetOwner } = getRoomDirectives({ room, showingUserId: uid, userSubscription });

		return (isRoomFederated(room) && roomCanSetOwner) ||
			(!isRoomFederated(room) && (roomCanSetOwner || hasManageRemotely) && (userCanSetOwner || hasManageRemotely))
			? {
					content: t(isOwner ? 'Remove_as_owner' : 'Set_as_owner'),
					icon: 'shield-check' as const,
					onClick: changeOwnerAction,
					type: 'privileges' as UserInfoActionType,
				}
			: undefined;
	}, [room, uid, userSubscription, isOwner, hasManageRemotely, userCanSetOwner, t, changeOwnerAction]);

	return changeOwnerOption;
};

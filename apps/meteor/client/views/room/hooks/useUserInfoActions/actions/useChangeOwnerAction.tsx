import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { useTranslation, usePermission, useUserRoom, useUserSubscription, useSetModal, useUser } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useMemo } from 'react';

import GenericModal from '../../../../../components/GenericModal';
import { useEndpointAction } from '../../../../../hooks/useEndpointAction';
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

export const useChangeOwnerAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): UserInfoAction | undefined => {
	const t = useTranslation();
	const room = useUserRoom(rid);
	const { _id: uid } = user;
	const userCanSetOwner = usePermission('set-owner', rid);
	const isOwner = useUserHasRoomRole(uid, rid, 'owner');
	const userSubscription = useUserSubscription(rid);
	const setModal = useSetModal();
	const { _id: loggedUserId = '' } = useUser() || {};
	const loggedUserIsOwner = useUserHasRoomRole(loggedUserId, rid, 'owner');
	const closeModal = useCallback(() => setModal(null), [setModal]);

	if (!room) {
		throw Error('Room not provided');
	}

	const { roomCanSetOwner } = getRoomDirectives({ room, showingUserId: uid, userSubscription });
	const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));

	const endpointPrefix = room.t === 'p' ? '/v1/groups' : '/v1/channels';
	const changeOwnerEndpoint = isOwner ? 'removeOwner' : 'addOwner';
	const changeOwnerMessage = isOwner ? 'User__username__removed_from__room_name__owners' : 'User__username__is_now_an_owner_of__room_name_';
	const changeOwner = useEndpointAction('POST', `${endpointPrefix}.${changeOwnerEndpoint}`, {
		successMessage: t(changeOwnerMessage, { username: user.username, room_name: roomName }),
	});

	const handleConfirm = useCallback(() => {
		changeOwner({ roomId: rid, userId: uid });
		closeModal();
	}, [changeOwner, rid, uid, closeModal]);

	const handleChangeOwner = useCallback(
		({ userId }) => {
			if (!isRoomFederated(room)) {
				return changeOwner({ roomId: rid, userId: uid });
			}
			const changingOwnRole = userId === loggedUserId;

			if (changingOwnRole && loggedUserIsOwner) {
				return setModal(() =>
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
				return setModal(() =>
					getWarningModalForFederatedRooms(
						closeModal,
						handleConfirm,
						t('Warning'),
						t('Yes_continue'),
						t('Federation_Matrix_giving_same_permission_warning'),
					),
				);
			}

			changeOwner({ roomId: rid, userId: uid });
		},
		[setModal, loggedUserId, loggedUserIsOwner, t, rid, uid, changeOwner, closeModal, handleConfirm, room],
	);

	const changeOwnerAction = useMutableCallback(async () => handleChangeOwner({ roomId: rid, userId: uid }));
	const changeOwnerOption = useMemo(
		() =>
			(isRoomFederated(room) && roomCanSetOwner) || (!isRoomFederated(room) && roomCanSetOwner && userCanSetOwner)
				? {
						content: t(isOwner ? 'Remove_as_owner' : 'Set_as_owner'),
						icon: 'shield-check' as const,
						onClick: changeOwnerAction,
						type: 'privileges' as UserInfoActionType,
				  }
				: undefined,
		[changeOwnerAction, roomCanSetOwner, userCanSetOwner, isOwner, t, room],
	);

	return changeOwnerOption;
};

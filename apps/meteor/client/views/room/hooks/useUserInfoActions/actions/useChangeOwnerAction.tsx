import React from 'react';
import { IRoom, IUser, isRoomFederated } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { useTranslation, usePermission, useUserRoom, useUserSubscription, useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';

import { useEndpointAction } from '../../../../../hooks/useEndpointAction';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import type { Action } from '../../../../hooks/useActionSpread';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import { useUserHasRoomRole } from '../../useUserHasRoomRole';
import GenericModal from '../../../../../components/GenericModal';
import { useUser } from '@rocket.chat/ui-contexts';

// TODO: Remove endpoint concatenation
export const useChangeOwnerAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): Action | undefined => {
	const t = useTranslation();
	const room = useUserRoom(rid);
	const { _id: uid } = user;
	const userCanSetOwner = usePermission('set-owner', rid);
	const isOwner = useUserHasRoomRole(uid, rid, 'owner');
	const userSubscription = useUserSubscription(rid);
	const setModal = useSetModal();
	const { _id: loggedUserId = '' } = useUser() || {};
	const loggedUserIsOwner = useUserHasRoomRole(loggedUserId, rid, 'owner');

	if (!room) {
		throw Error('Room not provided');
	}

	const endpointPrefix = room.t === 'p' ? '/v1/groups' : '/v1/channels';
	const { roomCanSetOwner } = getRoomDirectives(room, uid, userSubscription);
	const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));

	const changeOwnerEndpoint = isOwner ? 'removeOwner' : 'addOwner';
	const changeOwnerMessage = isOwner ? 'User__username__removed_from__room_name__owners' : 'User__username__is_now_an_owner_of__room_name_';

	const changeOwner = useEndpointAction('POST', `${endpointPrefix}.${changeOwnerEndpoint}` as const, {
		successMessage: t(changeOwnerMessage, { username: user.username, room_name: roomName }),
	});

	const handleChangeOwner = useCallback(
		({ userId }) => {
			const handleClose = (): void => {
				setModal(null);
			};
			if (userId === loggedUserId && loggedUserIsOwner) {
				setModal(() => (
					<GenericModal
						variant='warning'
						onClose={handleClose}
						onConfirm={() => changeOwner({ roomId: rid, userId: uid })}
						onCancel={handleClose}
						title={t('Federation_Matrix_losing_privileges')}
						confirmText={'Yes, continue'}
					>
						{t('Federation_Matrix_losing_privileges_warning')}
					</GenericModal>
				));
				return;
			}
			if (userId !== loggedUserId && loggedUserIsOwner) {
				setModal(() => (
					<GenericModal
						variant='warning'
						onClose={handleClose}
						onConfirm={() => changeOwner({ roomId: rid, userId: uid })}
						onCancel={handleClose}
						title={t('Warning')}
						confirmText={'Yes, continue'}
					>
						{t('Federation_Matrix_giving_same_permission_warning')}
					</GenericModal>
				));
			}
			changeOwner({ roomId: rid, userId: uid });
		},
		[setModal, loggedUserId, loggedUserIsOwner, t, rid, uid, changeOwner],
	);

	const changeOwnerAction = useMutableCallback(async () => handleChangeOwner({ roomId: rid, userId: uid }));
	const changeOwnerOption = useMemo(
		() =>
			(isRoomFederated(room) && roomCanSetOwner) || (!isRoomFederated(room) && roomCanSetOwner && userCanSetOwner)
				? {
						label: t(isOwner ? 'Remove_as_owner' : 'Set_as_owner'),
						icon: 'shield-check',
						action: changeOwnerAction,
				  }
				: undefined,
		[changeOwnerAction, roomCanSetOwner, userCanSetOwner, isOwner, t, room],
	);

	return changeOwnerOption;
};

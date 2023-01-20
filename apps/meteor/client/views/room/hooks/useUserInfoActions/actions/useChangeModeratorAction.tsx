import React from 'react';
import { IRoom, IUser, isRoomFederated } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { useTranslation, usePermission, useUserRoom, useUserSubscription, useUser } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';

import { useEndpointAction } from '../../../../../hooks/useEndpointAction';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import type { Action } from '../../../../hooks/useActionSpread';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import { useUserHasRoomRole } from '../../useUserHasRoomRole';
import GenericModal from '../../../../../components/GenericModal';
import { useSetModal } from '@rocket.chat/ui-contexts';

// TODO: Remove endpoint concatenation
export const useChangeModeratorAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): Action | undefined => {
	const t = useTranslation();
	const room = useUserRoom(rid);
	const { _id: uid } = user;

	const userCanSetModerator = usePermission('set-moderator', rid);
	const isModerator = useUserHasRoomRole(uid, rid, 'moderator');
	const userSubscription = useUserSubscription(rid);
	const { _id: loggedUserId = '' } = useUser() || {};
	const loggedUserIsModerator = useUserHasRoomRole(loggedUserId, rid, 'moderator');
	const loggedUserIsOwner = useUserHasRoomRole(loggedUserId, rid, 'owner');
	const setModal = useSetModal();

	if (!room) {
		throw Error('Room not provided');
	}

	const endpointPrefix = room.t === 'p' ? '/v1/groups' : '/v1/channels';
	const { roomCanSetModerator } = getRoomDirectives(room, uid, userSubscription);
	const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));

	const changeModeratorEndpoint = isModerator ? 'removeModerator' : 'addModerator';
	const changeModeratorMessage = isModerator
		? 'User__username__removed_from__room_name__moderators'
		: 'User__username__is_now_a_moderator_of__room_name_';

	const changeModerator = useEndpointAction('POST', `${endpointPrefix}.${changeModeratorEndpoint}`, {
		successMessage: t(changeModeratorMessage, { username: user.username, room_name: roomName }),
	});

	const handleChangeModerator = useCallback(
		({ userId }) => {
			const handleClose = (): void => {
				setModal(null);
			};
			if (userId === loggedUserId) {
				if (loggedUserIsModerator) {
					setModal(() => (
						<GenericModal
							variant='warning'
							onClose={handleClose}
							onConfirm={() => changeModerator({ roomId: rid, userId: uid })}
							onCancel={handleClose}
							title={t('Federation_Matrix_losing_privileges')}
							confirmText={'Yes, continue'}
						>
							{t('Federation_Matrix_losing_privileges_warning')}
						</GenericModal>
					));
					return;
				}
				if (loggedUserIsOwner) {
					setModal(() => (
						<GenericModal
							variant='warning'
							onClose={handleClose}
							onConfirm={() => changeModerator({ roomId: rid, userId: uid })}
							onCancel={handleClose}
							title={t('Federation_Matrix_losing_privileges')}
							confirmText={'Yes, continue'}
						>
							{t('Federation_Matrix_losing_privileges_warning')}
						</GenericModal>
					));
				}
				return;
			}
			if (userId !== loggedUserId && loggedUserIsModerator) {
				setModal(() => (
					<GenericModal
						variant='warning'
						onClose={handleClose}
						onConfirm={() => changeModerator({ roomId: rid, userId: uid })}
						onCancel={handleClose}
						title={t('Warning')}
						confirmText={'Yes, continue'}
					>
						{t('Federation_Matrix_giving_same_permission_warning')}
					</GenericModal>
				));
				return;
			}
			changeModerator({ roomId: rid, userId: uid });
		},
		[setModal, loggedUserId, loggedUserIsModerator, loggedUserIsOwner, t, rid, uid, changeModerator],
	);

	const changeModeratorAction = useMutableCallback(() => handleChangeModerator({ roomId: rid, userId: uid }));
	const changeModeratorOption = useMemo(
		() =>
			(isRoomFederated(room) && roomCanSetModerator) || (!isRoomFederated(room) && roomCanSetModerator && userCanSetModerator)
				? {
						label: t(isModerator ? 'Remove_as_moderator' : 'Set_as_moderator'),
						icon: 'shield-blank',
						action: changeModeratorAction,
				  }
				: undefined,
		[changeModeratorAction, isModerator, roomCanSetModerator, t, userCanSetModerator, room],
	);

	return changeModeratorOption;
};

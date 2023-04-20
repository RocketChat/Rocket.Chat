import type { IUser } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { useTranslation, usePermission, useUserSubscription, useUser, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useMemo } from 'react';

import GenericModal from '../../../../../components/GenericModal';
import { useEndpointAction } from '../../../../../hooks/useEndpointAction';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import type { Action } from '../../../../hooks/useActionSpread';
import { useRoom } from '../../../contexts/RoomContext';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import { useUserHasRoomRole } from '../../useUserHasRoomRole';

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

// TODO: Remove endpoint concatenation
export const useChangeModeratorAction = (user: Pick<IUser, '_id' | 'username'>): Action | undefined => {
	const t = useTranslation();
	const room = useRoom();
	const { _id: uid } = user;

	const userCanSetModerator = usePermission('set-moderator', room._id);
	const isModerator = useUserHasRoomRole(uid, room._id, 'moderator');
	const userSubscription = useUserSubscription(room._id);
	const { _id: loggedUserId = '' } = useUser() || {};
	const loggedUserIsModerator = useUserHasRoomRole(loggedUserId, room._id, 'moderator');
	const loggedUserIsOwner = useUserHasRoomRole(loggedUserId, room._id, 'owner');
	const setModal = useSetModal();
	const closeModal = useCallback(() => setModal(null), [setModal]);

	const endpointPrefix = room.t === 'p' ? '/v1/groups' : '/v1/channels';
	const { roomCanSetModerator } = getRoomDirectives({ room, showingUserId: uid, userSubscription });
	const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));

	const changeModeratorEndpoint = isModerator ? 'removeModerator' : 'addModerator';
	const changeModeratorMessage = isModerator
		? 'User__username__removed_from__room_name__moderators'
		: 'User__username__is_now_a_moderator_of__room_name_';

	const changeModerator = useEndpointAction('POST', `${endpointPrefix}.${changeModeratorEndpoint}`, {
		successMessage: t(changeModeratorMessage, { username: user.username, room_name: roomName }),
	});

	const handleConfirm = useCallback(() => {
		changeModerator({ roomId: room._id, userId: uid });
		closeModal();
	}, [changeModerator, room._id, uid, closeModal]);

	const handleChangeModerator = useCallback(
		({ userId }) => {
			if (!isRoomFederated(room)) {
				return changeModerator({ roomId: room._id, userId: uid });
			}

			const changingOwnRole = userId === loggedUserId;
			if (changingOwnRole && loggedUserIsModerator) {
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

			if (!changingOwnRole && loggedUserIsModerator) {
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

			changeModerator({ roomId: room._id, userId: uid });
		},
		[room, loggedUserId, loggedUserIsModerator, loggedUserIsOwner, changeModerator, uid, setModal, closeModal, handleConfirm, t],
	);

	const changeModeratorAction = useMutableCallback(() => handleChangeModerator({ roomId: room._id, userId: uid }));
	const changeModeratorOption = useMemo(
		() =>
			(isRoomFederated(room) && roomCanSetModerator) || (!isRoomFederated(room) && roomCanSetModerator && userCanSetModerator)
				? {
						label: t(isModerator ? 'Remove_as_moderator' : 'Set_as_moderator'),
						icon: 'shield-blank' as const,
						action: changeModeratorAction,
				  }
				: undefined,
		[changeModeratorAction, isModerator, roomCanSetModerator, t, userCanSetModerator, room],
	);

	return changeModeratorOption;
};

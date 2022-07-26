import { IRoom, isRoomFederated, IUser } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { usePermission, useSetModal, useTranslation, useUser, useUserRoom } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import * as Federation from '../../../../../../app/federation-v2/client/Federation';
import GenericModal from '../../../../../components/GenericModal';
import { useEndpointActionExperimental } from '../../../../../hooks/useEndpointActionExperimental';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import { Action } from '../../../../hooks/useActionSpread';
import RemoveUsersModal from '../../../../teams/contextualBar/members/RemoveUsersModal';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';

// TODO: Remove endpoint concatenation
export const useRemoveUserAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id'], reload?: () => void): Action | undefined => {
	const t = useTranslation();
	const room = useUserRoom(rid);
	const currentUser = useUser();
	const { _id: uid } = user;

	if (!room) {
		throw Error('Room not provided');
	}

	const hasPermissionToRemove = usePermission('remove-user', rid);
	const userCanRemove = isRoomFederated(room)
		? Federation.isEditableByTheUser(currentUser || undefined, room) && hasPermissionToRemove
		: hasPermissionToRemove;
	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal(null));
	const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));

	const endpointPrefix = room.t === 'p' ? '/v1/groups' : '/v1/channels';
	const { roomCanRemove } = getRoomDirectives(room);

	const removeFromTeam = useEndpointActionExperimental('POST', '/v1/teams.removeMember', t('User_has_been_removed_from_team'));
	const removeFromRoom = useEndpointActionExperimental('POST', `${endpointPrefix}.kick`, t('User_has_been_removed_from_s', roomName));

	const removeUserOptionAction = useMutableCallback(() => {
		const handleRemoveFromTeam = async (rooms: IRoom[]): Promise<void> => {
			if (room.teamId) {
				const roomKeys = Object.keys(rooms);
				await removeFromTeam({
					teamId: room.teamId,
					userId: uid,
					...(roomKeys.length && { rooms: roomKeys }),
				});
				closeModal();
				reload?.();
			}
		};

		const handleRemoveFromRoom = async (rid: IRoom['_id'], uid: IUser['_id']): Promise<void> => {
			await removeFromRoom({ roomId: rid, userId: uid });
			closeModal();
			reload?.();
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
						label: (
							<Box color='danger'>
								<Icon mie='x4' name='cross' size='x20' />
								{room?.teamMain ? t('Remove_from_team') : t('Remove_from_room')}
							</Box>
						),
						action: removeUserOptionAction,
				  }
				: undefined,
		[room, roomCanRemove, userCanRemove, removeUserOptionAction, t],
	);

	return removeUserOption;
};

import { IRoom, IUser } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { escapeHTML } from '@rocket.chat/string-helpers';
import React, { useMemo } from 'react';

import GenericModal from '../../../../../components/GenericModal';
import { usePermission } from '../../../../../contexts/AuthorizationContext';
import { useSetModal } from '../../../../../contexts/ModalContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useEndpointActionExperimental } from '../../../../../hooks/useEndpointActionExperimental';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import { Action } from '../../../../hooks/useActionSpread';
import RemoveUsersModal from '../../../../teams/contextualBar/members/RemoveUsersModal';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';

export const useRemoveUserAction = (room: IRoom, user: Pick<IUser, '_id' | 'username'>, reload: () => void): Action => {
	const t = useTranslation();
	const rid = room._id;
	const { _id: uid } = user;

	const userCanRemove = usePermission('remove-user', rid);
	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal(null));

	const endpointPrefix = room.t === 'p' ? 'groups' : 'channels';
	const roomName = room?.t && escapeHTML(roomCoordinator.getRoomName(room.t, room));
	const [roomCanRemove] = getRoomDirectives(room);

	const removeFromTeam = useEndpointActionExperimental('POST', 'teams.removeMember', t('User_has_been_removed_from_team'));
	const removeFromRoom = useEndpointActionExperimental('POST', `${endpointPrefix}.kick`, t('User_has_been_removed_from_s', roomName));

	const removeUserOptionAction = useMutableCallback(() => {
		if (room.teamMain && room.teamId) {
			return setModal(
				<RemoveUsersModal
					teamId={room?.teamId}
					userId={uid}
					onClose={closeModal}
					onCancel={closeModal}
					onConfirm={async (rooms: IRoom[]): Promise<void> => {
						const roomKeys = Object.keys(rooms);
						await removeFromTeam({
							teamId: room.teamId,
							userId: uid,
							...(roomKeys.length && { rooms: roomKeys }),
						});
						closeModal();
						reload?.();
					}}
				/>,
			);
		}

		setModal(
			<GenericModal
				variant='danger'
				confirmText={t('Yes_remove_user')}
				onClose={closeModal}
				onCancel={closeModal}
				onConfirm={async (): Promise<void> => {
					await removeFromRoom({ roomId: rid, userId: uid });
					closeModal();
					reload?.();
				}}
			>
				{t('The_user_will_be_removed_from_s', roomName)}
			</GenericModal>,
		);
	});

	const removeUserOption = useMemo(
		() =>
			roomCanRemove &&
			userCanRemove && {
				label: (
					<Box color='danger'>
						<Icon mie='x4' name='cross' size='x20' />
						{room.teamMain ? t('Remove_from_team') : t('Remove_from_room')}
					</Box>
				),
				// icon: 'sign-out',
				action: removeUserOptionAction,
			},
		[room, roomCanRemove, userCanRemove, removeUserOptionAction, t],
	);

	return removeUserOption;
};

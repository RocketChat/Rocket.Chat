import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../../components/GenericModal';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';

export const useRemoveRoomFromTeam = (room: IRoom, reload: () => void) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const removeRoomEndpoint = useEndpoint('POST', '/v1/teams.removeRoom');

	const handleRemoveRoom = () => {
		const onConfirmAction = async () => {
			if (!room.teamId) {
				return;
			}

			try {
				await removeRoomEndpoint({ teamId: room.teamId, roomId: room._id });
				dispatchToastMessage({ type: 'error', message: t('Room_has_been_removed') });
				reload();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		return setModal(
			<GenericModal variant='danger' onCancel={() => setModal(null)} onConfirm={onConfirmAction} confirmText={t('Remove')}>
				{t('Team_Remove_from_team_modal_content', {
					teamName: roomCoordinator.getRoomName(room.t, room),
				})}
			</GenericModal>,
		);
	};

	return handleRemoveRoom;
};

import { isRoomFederated } from '@rocket.chat/core-typings';
import type { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import React from 'react';

import ChannelToTeamModal from '../../ChannelToTeamModal/ChannelToTeamModal';
import { useCanEditRoom } from '../useCanEditRoom';

export const useRoomMoveToTeam = (room: IRoom) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const moveChannelToTeam = useEndpoint('POST', '/v1/teams.addRooms');

	const canEdit = useCanEditRoom(room);
	const canMoveToTeam = !isRoomFederated(room) && !room.teamId && !room.prid && canEdit;

	const handleMoveToTeam = useMutableCallback(async () => {
		const onConfirm = async (teamId: IRoom['teamId']) => {
			try {
				await moveChannelToTeam({ rooms: [room._id], teamId });
				dispatchToastMessage({ type: 'success', message: t('Rooms_added_successfully') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(<ChannelToTeamModal rid={room._id} onClose={() => setModal(null)} onCancel={() => setModal(null)} onConfirm={onConfirm} />);
	});

	return canMoveToTeam ? handleMoveToTeam : null;
};

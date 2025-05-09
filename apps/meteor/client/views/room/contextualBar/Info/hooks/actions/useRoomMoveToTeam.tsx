import { isRoomFederated } from '@rocket.chat/core-typings';
import type { IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';

import ChannelToTeamModal from '../../ChannelToTeamModal';
import { useCanEditRoom } from '../useCanEditRoom';

export const useRoomMoveToTeam = (room: IRoom) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const canEdit = useCanEditRoom(room);
	const canMoveToTeam = !isRoomFederated(room) && !room.teamId && !room.prid && canEdit;

	const moveChannelToTeam = useEndpoint('POST', '/v1/teams.addRooms');

	const handleMoveToTeam = useEffectEvent(async () => {
		const onConfirm = async (teamId: IRoom['teamId']) => {
			if (!teamId) {
				throw new Error('teamId not provided');
			}

			try {
				await moveChannelToTeam({ rooms: [room._id], teamId });
				dispatchToastMessage({ type: 'success', message: t('Rooms_added_successfully') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(<ChannelToTeamModal onCancel={() => setModal(null)} onConfirm={onConfirm} />);
	});

	return canMoveToTeam ? handleMoveToTeam : null;
};

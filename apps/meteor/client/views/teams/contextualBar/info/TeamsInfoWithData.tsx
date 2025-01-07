import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useUserId, usePermission, useRouter } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import LeaveTeam from './LeaveTeam';
import TeamsInfo from './TeamsInfo';
import { useEndpointAction } from '../../../../hooks/useEndpointAction';
import { useHideRoomAction } from '../../../../hooks/useHideRoomAction';
import { useDeleteRoom } from '../../../hooks/roomActions/useDeleteRoom';
import { useRoom } from '../../../room/contexts/RoomContext';
import { useRoomToolbox } from '../../../room/contexts/RoomToolboxContext';
import ConvertToChannelModal from '../../ConvertToChannelModal';

type TeamsInfoWithLogicProps = {
	openEditing: () => void;
};

const TeamsInfoWithLogic = ({ openEditing }: TeamsInfoWithLogicProps) => {
	const room = useRoom();
	const { openTab, closeTab } = useRoomToolbox();
	const { t } = useTranslation();
	const userId = useUserId();

	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal());

	const leaveTeam = useEndpointAction('POST', '/v1/teams.leave');
	const convertTeamToChannel = useEndpointAction('POST', '/v1/teams.convertToChannel');

	const hideTeam = useHideRoomAction({ rid: room._id, type: room.t, name: room.name ?? '' });

	const router = useRouter();

	const canEdit = usePermission('edit-team-channel', room._id);

	// const canLeave = usePermission('leave-team'); /* && room.cl !== false && joined */

	const { handleDelete, canDeleteRoom } = useDeleteRoom(room);

	const onClickLeave = useMutableCallback(() => {
		const onConfirm = async (selectedRooms: { [key: string]: Serialized<IRoom> & { isLastOwner?: boolean } } = {}) => {
			const roomsLeft = Object.keys(selectedRooms);
			const roomsToLeave = Array.isArray(roomsLeft) && roomsLeft.length > 0 ? roomsLeft : [];

			try {
				await leaveTeam({
					teamId: room.teamId!,
					...(roomsToLeave.length && { rooms: roomsToLeave }),
				});
				dispatchToastMessage({ type: 'success', message: t('Teams_left_team_successfully') });
				router.navigate('/home');
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				closeModal();
			}
		};

		setModal(<LeaveTeam onConfirm={onConfirm} onCancel={closeModal} teamId={room.teamId!} />);
	});

	const onClickViewChannels = useCallback(() => openTab('team-channels'), [openTab]);

	const onClickConvertToChannel = useMutableCallback(() => {
		const onConfirm = async (roomsToRemove: { [key: string]: Serialized<IRoom> }) => {
			try {
				await convertTeamToChannel({
					teamId: room.teamId!,
					roomsToRemove: Object.keys(roomsToRemove),
				});

				dispatchToastMessage({ type: 'success', message: t('Success') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				closeModal();
			}
		};

		setModal(
			<ConvertToChannelModal onClose={closeModal} onCancel={closeModal} onConfirm={onConfirm} teamId={room.teamId!} userId={userId!} />,
		);
	});

	return (
		<TeamsInfo
			room={room}
			onClickEdit={canEdit ? openEditing : undefined}
			onClickClose={closeTab}
			onClickDelete={canDeleteRoom ? handleDelete : undefined}
			onClickLeave={onClickLeave}
			onClickHide={hideTeam}
			onClickViewChannels={onClickViewChannels}
			onClickConvertToChannel={canEdit ? onClickConvertToChannel : undefined}
		/>
	);
};

export default TeamsInfoWithLogic;

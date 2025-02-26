import type { IRoom, RoomAdminFieldsType } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRouter, usePermission, useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../components/GenericModal';
import DeleteTeamModal from '../../teams/contextualBar/info/DeleteTeam';

export const useDeleteRoom = (room: IRoom | Pick<IRoom, RoomAdminFieldsType>, { reload }: { reload?: () => void } = {}) => {
	const { t } = useTranslation();
	const router = useRouter();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	// eslint-disable-next-line no-nested-ternary
	const roomType = 'prid' in room ? 'discussion' : room.teamId && room.teamMain ? 'team' : 'channel';
	const isAdminRoute = router.getRouteName() === 'admin-rooms';

	const deleteRoomEndpoint = useEndpoint('POST', '/v1/rooms.delete');
	const deleteTeamEndpoint = useEndpoint('POST', '/v1/teams.delete');
	const teamsInfoEndpoint = useEndpoint('GET', '/v1/teams.info');

	const teamId = room.teamId || '';
	const { data: teamInfoData } = useQuery({
		queryKey: ['teamId', teamId],
		queryFn: async () => teamsInfoEndpoint({ teamId }),
		placeholderData: keepPreviousData,
		retry: false,
		enabled: room.teamId !== '',
	});

	const hasPermissionToDeleteRoom = usePermission(`delete-${room.t}`, room._id);
	const hasPermissionToDeleteTeamRoom = usePermission(`delete-team-${room.t === 'c' ? 'channel' : 'group'}`, teamInfoData?.teamInfo.roomId);
	const isTeamRoom = room.teamId;
	const canDeleteRoom = isRoomFederated(room) ? false : hasPermissionToDeleteRoom && (!isTeamRoom || hasPermissionToDeleteTeamRoom);

	const deleteRoomMutation = useMutation({
		mutationFn: deleteRoomEndpoint,
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Deleted_roomType', { roomName: room.name, roomType }) });
			if (isAdminRoute) {
				return router.navigate('/admin/rooms');
			}

			return router.navigate('/home');
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			setModal(null);
			reload?.();
		},
	});

	const deleteTeamMutation = useMutation({
		mutationFn: deleteTeamEndpoint,
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Team_has_been_deleted') });
			if (isAdminRoute) {
				return router.navigate('/admin/rooms');
			}

			return router.navigate('/home');
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			setModal(null);
			reload?.();
		},
	});

	const isDeleting = deleteTeamMutation.isPending || deleteRoomMutation.isPending;

	const handleDelete = useEffectEvent(() => {
		const handleDeleteTeam = async (roomsToRemove: IRoom['_id'][]) => {
			if (!room.teamId) {
				return;
			}

			deleteTeamMutation.mutateAsync({ teamId: room.teamId, ...(roomsToRemove.length && { roomsToRemove }) });
		};

		if (room.teamMain && room.teamId) {
			return setModal(<DeleteTeamModal onConfirm={handleDeleteTeam} onCancel={(): void => setModal(null)} teamId={room.teamId} />);
		}

		const handleDeleteRoom = async () => {
			deleteRoomMutation.mutateAsync({ roomId: room._id });
		};

		setModal(
			<GenericModal
				title={t('Delete_roomType', { roomType })}
				variant='danger'
				onConfirm={handleDeleteRoom}
				onCancel={(): void => setModal(null)}
				confirmText={t('Yes_delete_it')}
			>
				{t('Delete_Room_Warning', { roomType })}
			</GenericModal>,
		);
	});

	return { handleDelete, canDeleteRoom, isDeleting };
};

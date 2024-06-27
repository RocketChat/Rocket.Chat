import type { IRoom } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useDeleteRoom } from '../../../../hooks/roomActions/useDeleteRoom';
import { useRoomConvertToTeam } from './actions/useRoomConvertToTeam';
import { useRoomHide } from './actions/useRoomHide';
import { useRoomLeave } from './actions/useRoomLeave';
import { useRoomMoveToTeam } from './actions/useRoomMoveToTeam';

type UseRoomActionsOptions = {
	onClickEnterRoom?: () => void;
	onClickEdit?: () => void;
	resetState?: () => void;
};

export const useRoomActions = (room: IRoom, options: UseRoomActionsOptions) => {
	const { onClickEnterRoom, onClickEdit, resetState } = options;

	const t = useTranslation();
	const handleHide = useRoomHide(room);
	const handleLeave = useRoomLeave(room);
	const { handleDelete, canDeleteRoom } = useDeleteRoom(room, { reload: resetState });
	const handleMoveToTeam = useRoomMoveToTeam(room);
	const handleConvertToTeam = useRoomConvertToTeam(room);

	return useMemo(() => {
		const memoizedActions = {
			items: [
				{
					id: 'hide',
					content: t('Hide'),
					icon: 'eye-off' as const,
					onClick: handleHide,
				},

				...(onClickEnterRoom
					? [
							{
								id: 'enter',
								content: t('Enter'),
								icon: 'login' as const,
								onClick: onClickEnterRoom,
							},
					  ]
					: []),
				...(onClickEdit
					? [
							{
								id: 'edit',
								content: t('Edit'),
								icon: 'edit' as const,
								onClick: onClickEdit,
							},
					  ]
					: []),
				...(handleLeave
					? [
							{
								id: 'leave',
								content: t('Leave'),
								icon: 'sign-out' as const,
								onClick: handleLeave,
							},
					  ]
					: []),
				...(handleMoveToTeam
					? [
							{
								id: 'move_channel_team',
								content: t('Teams_move_channel_to_team'),
								icon: 'team-arrow-right' as const,
								onClick: handleMoveToTeam,
							},
					  ]
					: []),
				...(handleConvertToTeam
					? [
							{
								id: 'convert_channel_team',
								content: t('Teams_convert_channel_to_team'),
								icon: 'team' as const,
								onClick: handleConvertToTeam,
							},
					  ]
					: []),
				...(canDeleteRoom
					? [
							{
								id: 'delete',
								content: t('Delete'),
								icon: 'trash' as const,
								onClick: handleDelete,
								variant: 'danger',
							},
					  ]
					: []),
			],
		};

		return memoizedActions;
	}, [canDeleteRoom, handleConvertToTeam, handleDelete, handleHide, handleLeave, handleMoveToTeam, onClickEdit, onClickEnterRoom, t]);
};

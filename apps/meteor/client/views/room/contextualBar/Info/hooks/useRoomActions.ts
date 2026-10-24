import type { IRoom } from '@rocket.chat/core-typings';
import { useUserSubscription } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoomConvertToTeam } from './actions/useRoomConvertToTeam';
import { useRoomLeave } from './actions/useRoomLeave';
import { useRoomMoveToTeam } from './actions/useRoomMoveToTeam';
import { useHideRoomAction } from '../../../../../hooks/useHideRoomAction';
import { useUnhideRoomAction } from '../../../../../hooks/useUnhideRoomAction';
import { useDeleteRoom } from '../../../../hooks/roomActions/useDeleteRoom';

type UseRoomActionsOptions = {
	onClickEnterRoom?: () => void;
	onClickEdit?: () => void;
	resetState?: () => void;
};

export const useRoomActions = (room: IRoom, options: UseRoomActionsOptions) => {
	const { onClickEnterRoom, onClickEdit, resetState } = options;

	const { t } = useTranslation();
	const subscription = useUserSubscription(room._id);
	const isRoomHidden = subscription?.open === false;

	const handleLeave = useRoomLeave(room);
	const { handleDelete, canDeleteRoom } = useDeleteRoom(room, { reload: resetState });
	const handleMoveToTeam = useRoomMoveToTeam(room);
	const handleConvertToTeam = useRoomConvertToTeam(room);
	const handleHide = useHideRoomAction({ rid: room._id, type: room.t, name: room.name ?? '' });
	const handleUnhide = useUnhideRoomAction({ rid: room._id, type: room.t });

	return useMemo(() => {
		const memoizedActions = {
			items: [
				{
					id: isRoomHidden ? 'unhide' : 'hide',
					content: isRoomHidden ? t('Unhide') : t('Hide'),
					icon: isRoomHidden ? ('eye' as const) : ('eye-off' as const),
					onClick: isRoomHidden ? handleUnhide : handleHide,
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
	}, [
		canDeleteRoom,
		handleConvertToTeam,
		handleDelete,
		handleHide,
		handleUnhide,
		handleLeave,
		handleMoveToTeam,
		isRoomHidden,
		onClickEdit,
		onClickEnterRoom,
		t,
	]);
};

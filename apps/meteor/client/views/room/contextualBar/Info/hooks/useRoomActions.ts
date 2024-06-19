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

/**
 *
 * @param room
 * @param param1
 * @param resetState
 * @returns If more than two room actions are enabled `menu.regular` will be a non-empty array
 */
export const useRoomActions = (room: IRoom, { onClickEnterRoom, onClickEdit, resetState }: UseRoomActionsOptions) => {
	const t = useTranslation();
	const size = 2;

	const handleHide = useRoomHide(room);
	const handleLeave = useRoomLeave(room);
	const { handleDelete, canDeleteRoom } = useDeleteRoom(room, { reload: resetState });
	const handleMoveToTeam = useRoomMoveToTeam(room);
	const handleConvertToTeam = useRoomConvertToTeam(room);

	return useMemo(() => {
		const memoizedActions = [
			...(handleHide
				? [
						{
							id: 'hide',
							name: t('Hide'),
							icon: 'eye-off' as const,
							action: handleHide,
						},
				  ]
				: []),
			...(onClickEnterRoom
				? [
						{
							id: 'enter',
							name: t('Enter'),
							icon: 'login' as const,
							action: onClickEnterRoom,
						},
				  ]
				: []),
			...(onClickEdit
				? [
						{
							id: 'edit',
							name: t('Edit'),
							icon: 'edit' as const,
							action: onClickEdit,
						},
				  ]
				: []),
			...(handleLeave
				? [
						{
							id: 'leave',
							name: t('Leave'),
							icon: 'sign-out' as const,
							action: handleLeave,
						},
				  ]
				: []),
			...(handleMoveToTeam
				? [
						{
							id: 'move_channel_team',
							name: t('Teams_move_channel_to_team'),
							icon: 'team-arrow-right' as const,
							action: handleMoveToTeam,
						},
				  ]
				: []),
			...(handleConvertToTeam
				? [
						{
							id: 'convert_channel_team',
							name: t('Teams_convert_channel_to_team'),
							icon: 'team' as const,
							action: handleConvertToTeam,
						},
				  ]
				: []),
		];

		if (memoizedActions.length <= size) {
			return { actions: memoizedActions };
		}

		const actions = memoizedActions.slice(0, size);
		const regular = memoizedActions.slice(size);
		const danger = canDeleteRoom
			? [
					{
						id: 'delete',
						name: t('Delete'),
						icon: 'trash' as const,
						action: handleDelete,
						variant: 'danger',
					},
			  ]
			: null;

		return { actions, menu: { regular, danger } };
	}, [canDeleteRoom, handleConvertToTeam, handleDelete, handleHide, handleLeave, handleMoveToTeam, onClickEdit, onClickEnterRoom, t]);
};

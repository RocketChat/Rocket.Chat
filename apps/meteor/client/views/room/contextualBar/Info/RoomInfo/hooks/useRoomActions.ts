import { isRoomFederated } from '@rocket.chat/core-typings';
import type { IRoom } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useRoomConvertToTeam } from './actions/useRoomConvertToTeam';
import { useRoomDelete } from './actions/useRoomDelete';
import { useRoomHide } from './actions/useRoomHide';
import { useRoomLeave } from './actions/useRoomLeave';
import { useRoomMoveToTeam } from './actions/useRoomMoveToTeam';

type RoomActions = {
	onClickEnterRoom?: () => void;
	onClickEdit?: () => void;
};

export const useRoomActions = (room: IRoom, { onClickEnterRoom, onClickEdit }: RoomActions, resetState?: () => void) => {
	const t = useTranslation();
	const isFederated = isRoomFederated(room);

	const handleHide = useRoomHide(room);
	const handleLeave = useRoomLeave(room);
	const handleDelete = useRoomDelete(room, resetState);
	const handleMoveToTeam = useRoomMoveToTeam(room);
	const handleConvertToTeam = useRoomConvertToTeam(room);

	const memoizedActions = useMemo(
		() => ({
			...(onClickEnterRoom && {
				enter: {
					label: t('Enter'),
					icon: 'login' as const,
					action: onClickEnterRoom,
				},
			}),
			...(onClickEdit && {
				edit: {
					label: t('Edit'),
					icon: 'edit' as const,
					action: onClickEdit,
				},
			}),
			...(!isFederated &&
				handleDelete && {
					delete: {
						label: t('Delete'),
						icon: 'trash' as const,
						action: handleDelete,
					},
				}),
			...(handleMoveToTeam && {
				move: {
					label: t('Teams_move_channel_to_team'),
					icon: 'team-arrow-right' as const,
					action: handleMoveToTeam,
				},
			}),
			...(handleConvertToTeam && {
				convert: {
					label: t('Teams_convert_channel_to_team'),
					icon: 'team' as const,
					action: handleConvertToTeam,
				},
			}),
			...(handleHide && {
				hide: {
					label: t('Hide'),
					action: handleHide,
					icon: 'eye-off' as const,
				},
			}),
			...(handleLeave && {
				leave: {
					label: t('Leave'),
					action: handleLeave,
					icon: 'sign-out' as const,
				},
			}),
		}),
		[onClickEdit, t, handleDelete, handleMoveToTeam, handleConvertToTeam, handleHide, handleLeave, onClickEnterRoom, isFederated],
	);

	return memoizedActions;
};

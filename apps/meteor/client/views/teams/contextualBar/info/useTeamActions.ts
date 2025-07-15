import {isRoomFederated,type IRoom } from '@rocket.chat/core-typings';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useConvertToChannel } from './useConvertToChannel';
import { useLeaveTeam } from './useLeaveTeam';
import { useHideRoomAction } from '../../../../hooks/useHideRoomAction';
import { useDeleteRoom } from '../../../hooks/roomActions/useDeleteRoom';

import { useSetting } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useReactiveValue } from '/client/hooks/useReactiveValue';
import { roomCoordinator } from '/client/lib/rooms/roomCoordinator';
type GenProps = {
	onClickEdit?: () => void;
};

export const useTeamActions = (room: IRoom, { onClickEdit }: GenProps) => {
	const { t } = useTranslation();
	const hideTeam = useHideRoomAction({ rid: room._id, type: room.t, name: room.name ?? '' });
	const convertToChannel = useConvertToChannel(room);
	const { handleDelete, canDeleteRoom } = useDeleteRoom(room);
	const leaveTeam = useLeaveTeam(room);

	const federationMatrixEnabled = useSetting('Federation_Matrix_enabled', false);

	const reactiveIsMember = useReactiveValue(
		useCallback(() => {
			if (!room.t) {
				return false;
			}

			if (!roomCoordinator.getRoomDirectives(room.t).canSendMessage(room)) {
				return false;
			}

			if (isRoomFederated(room)) {
				return federationMatrixEnabled;
			}
			return true;
		}, [federationMatrixEnabled, room]),
	);
	const isMember = useReactiveValue(() => reactiveIsMember);
	return useMemo(
		() => ({
			items: [
				{
					id: 'hide',
					content: t('Hide'),
					icon: 'eye-off' as const,
					onClick: hideTeam,
				},
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
				...(isMember && leaveTeam
					? [
							{
								id: 'leave',
								content: t('Leave'),
								icon: 'sign-out' as const,
								onClick: leaveTeam,
							},
						]
					: []),
				...(convertToChannel
					? [
							{
								id: 'convert_team_to_channel',
								content: t('Convert_to_channel'),
								icon: 'hash' as const,
								onClick: convertToChannel,
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
		}),
		[t, hideTeam, leaveTeam, onClickEdit, handleDelete, canDeleteRoom, convertToChannel,isMember],
	);
};

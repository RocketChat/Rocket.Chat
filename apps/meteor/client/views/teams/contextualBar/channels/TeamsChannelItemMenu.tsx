import type { IRoom } from '@rocket.chat/core-typings';
import { CheckBox } from '@rocket.chat/fuselage';
import { usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericMenu from '../../../../components/GenericMenu/GenericMenu';
import type { GenericMenuItemProps } from '../../../../components/GenericMenu/GenericMenuItem';
import { useDeleteRoom } from './hooks/useDeleteRoom';
import { useRemoveRoomFromTeam } from './hooks/useRemoveRoomFromTeam';
import { useToggleAutoJoin } from './hooks/useToggleAutoJoin';

const TeamsChannelItemMenu = ({ room, reload }: { room: IRoom; reload: () => void }) => {
	const t = useTranslation();

	const canDeleteTeamChannel = usePermission(room.t === 'c' ? 'delete-c' : 'delete-p', room._id);
	const canEditTeamChannel = usePermission('edit-team-channel', room._id);
	const canRemoveTeamChannel = usePermission('remove-team-channel', room._id);

	const removeRoomAction = useRemoveRoomFromTeam(room, reload);
	const deleteRoomAction = useDeleteRoom(room, reload);
	const toggleAutoJoinAction = useToggleAutoJoin(room, reload);

	const toggleAutoJoin = {
		id: 'toggleAutoJoin',
		icon: room.t === 'c' ? 'hash' : 'hashtag-lock',
		content: t('Team_Auto-join'),
		onClick: toggleAutoJoinAction,
		addon: <CheckBox checked={room.teamDefault} />,
	};

	const removeRoom = {
		id: 'removeRoom',
		icon: 'cross',
		content: t('Team_Remove_from_team'),
		onClick: removeRoomAction,
		variant: 'danger',
	};

	const deleteRoom = {
		id: 'deleteRoom',
		icon: 'trash',
		content: t('Delete'),
		onClick: deleteRoomAction,
		variant: 'danger',
	};

	return (
		<GenericMenu
			title={t('More')}
			placement='bottom-end'
			sections={[
				{
					title: '',
					items: [canEditTeamChannel && toggleAutoJoin, canRemoveTeamChannel && removeRoom, canDeleteTeamChannel && deleteRoom].filter(
						Boolean,
					) as GenericMenuItemProps[],
				},
			]}
		/>
	);
};

export default TeamsChannelItemMenu;

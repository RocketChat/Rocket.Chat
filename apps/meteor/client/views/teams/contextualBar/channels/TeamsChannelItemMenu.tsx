import type { IRoom } from '@rocket.chat/core-typings';
import { CheckBox } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericMenu from '../../../../components/GenericMenu/GenericMenu';
import type { GenericMenuItemProps } from '../../../../components/GenericMenu/GenericMenuItem';
import { useDeleteRoom } from '../../../hooks/roomActions/useDeleteRoom';
import { useRemoveRoomFromTeam } from './hooks/useRemoveRoomFromTeam';
import { useToggleAutoJoin } from './hooks/useToggleAutoJoin';

const TeamsChannelItemMenu = ({ room, reload }: { room: IRoom; reload?: () => void }) => {
	const t = useTranslation();

	const { handleRemoveRoom, canRemoveTeamChannel } = useRemoveRoomFromTeam(room, { reload });
	const { handleDelete, canDeleteRoom } = useDeleteRoom(room, { reload });
	const { handleToggleAutoJoin, canEditTeamChannel } = useToggleAutoJoin(room, { reload });

	const toggleAutoJoin = {
		id: 'toggleAutoJoin',
		icon: room.t === 'c' ? 'hash' : 'hashtag-lock',
		content: t('Team_Auto-join'),
		onClick: handleToggleAutoJoin,
		addon: <CheckBox checked={room.teamDefault} />,
	};

	const removeRoom = {
		id: 'removeRoom',
		icon: 'cross',
		content: t('Team_Remove_from_team'),
		onClick: handleRemoveRoom,
		variant: 'danger',
	};

	const deleteRoom = {
		id: 'deleteRoom',
		icon: 'trash',
		content: t('Delete'),
		onClick: handleDelete,
		variant: 'danger',
	};

	return (
		<GenericMenu
			title={t('More')}
			placement='bottom-end'
			sections={[
				{
					title: '',
					items: [canEditTeamChannel && toggleAutoJoin, canRemoveTeamChannel && removeRoom, canDeleteRoom && deleteRoom].filter(
						Boolean,
					) as GenericMenuItemProps[],
				},
			]}
		/>
	);
};

export default TeamsChannelItemMenu;

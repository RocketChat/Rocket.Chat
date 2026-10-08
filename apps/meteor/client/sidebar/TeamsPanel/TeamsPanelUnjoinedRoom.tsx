import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, SidebarItemIcon } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ComponentType } from 'react';
import { useTranslation } from 'react-i18next';

import type { TeamUnjoinedRoom } from './hooks/useTeamUnjoinedRooms';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import type { RoomListRowProps } from '../RoomList/RoomListRow';

type TeamsPanelUnjoinedRoomProps = {
	data: RoomListRowProps['data'];
	room: TeamUnjoinedRoom;
};

// Rooms the user has not joined read as secondary to the joined ones, as in the "Team channels" contextual bar.
const unjoinedStyle = css`
	.rcx-sidebar-item__title,
	.rcx-sidebar-item__icon {
		color: var(--rcx-color-font-hint, #9ea2a8);
	}
`;

/** Opens the room preview, where the user can read it and join. */
const TeamsPanelUnjoinedRoom = ({ data: { SidebarItemTemplate, AvatarTemplate, openedRoom }, room }: TeamsPanelUnjoinedRoomProps) => {
	// The view mode templates render a Fuselage `SidebarItem`, which takes `is` to render as a link, like the joined rooms do.
	const ItemTemplate = SidebarItemTemplate as ComponentType<ComponentProps<typeof SidebarItemTemplate> & { is?: string }>;
	const { t } = useTranslation();
	const href = roomCoordinator.getRouteLink(room.t, { rid: room._id, name: room.name }) || '';
	const title = room.fname || room.name || '';
	const selected = room._id === openedRoom;

	return (
		<Box className={unjoinedStyle}>
			<ItemTemplate
				is='a'
				href={href}
				title={title}
				aria-label={t('Teams_panel_room_not_joined', { room: title })}
				selected={selected}
				aria-current={selected ? 'page' : undefined}
				icon={<SidebarItemIcon icon={<Icon name='hash' size='x20' />} />}
				avatar={
					AvatarTemplate && (
						<AvatarTemplate {...({ rid: room._id, t: room.t, name: room.name, avatarETag: room.avatarETag } as SubscriptionWithRoom)} />
					)
				}
			/>
		</Box>
	);
};

export default TeamsPanelUnjoinedRoom;

import {
	IconButton,
	SidebarV2Item,
	SidebarV2ItemAvatarWrapper,
	SidebarV2ItemCol,
	SidebarV2ItemContent,
	SidebarV2ItemMenu,
	SidebarV2ItemRow,
	SidebarV2ItemTimestamp,
	SidebarV2ItemTitle,
	// Tag,
} from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { memo, useState } from 'react';

import SidePanelParentRoom from './SidePanelParentRoom';
import { useShortTimeAgo } from '../../../../hooks/useTimeAgo';
// import { useTemplateByViewMode } from '../../../../sidebarv2/hooks/useTemplateByViewMode';
import { useItemData } from '../hooks/useItemData';

type RoomSidepanelItemProps = {
	openedRoom?: string;
	room: SubscriptionWithRoom;
	parentRid?: string;
	viewMode?: 'extended' | 'medium' | 'condensed';
};

const RoomSidepanelItem = ({ room, openedRoom }: RoomSidepanelItemProps) => {
	// const SidepanelItem = useTemplateByViewMode();

	const { href, selected, avatar, unread, icon, title, time, badges, menu, subtitle, ...props } = useItemData(room, {
		viewMode: 'condensed',
		openedRoom,
	});

	const formatDate = useShortTimeAgo();
	const [menuVisibility, setMenuVisibility] = useState(!!window.DISABLE_ANIMATION);

	const handleFocus = () => setMenuVisibility(true);
	const handlePointerEnter = () => setMenuVisibility(true);

	const parentRoomId = Boolean(room.prid || (room.teamId && !room.teamMain));

	return (
		<SidebarV2Item {...props} href={href} selected={selected} onFocus={handleFocus} onPointerEnter={handlePointerEnter}>
			<SidebarV2ItemCol>
				{parentRoomId && (
					<SidebarV2ItemRow>
						<SidePanelParentRoom room={room} />
					</SidebarV2ItemRow>
				)}
				<SidebarV2ItemRow>
					{avatar && <SidebarV2ItemAvatarWrapper>{avatar}</SidebarV2ItemAvatarWrapper>}
					{icon && icon}
					<SidebarV2ItemTitle unread={unread}>{title}</SidebarV2ItemTitle>
					{time && <SidebarV2ItemTimestamp>{formatDate(time)}</SidebarV2ItemTimestamp>}
				</SidebarV2ItemRow>
				<SidebarV2ItemRow>
					<SidebarV2ItemContent unread={unread}>{subtitle}</SidebarV2ItemContent>
					{badges && badges}
					{menu && (
						<SidebarV2ItemMenu>
							{menuVisibility ? menu : <IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-v2-item__menu icon='kebab' />}
						</SidebarV2ItemMenu>
					)}
				</SidebarV2ItemRow>
			</SidebarV2ItemCol>
		</SidebarV2Item>
	);
};

export default memo(RoomSidepanelItem);

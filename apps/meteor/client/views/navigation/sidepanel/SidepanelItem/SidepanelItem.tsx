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
import { useLayout, type SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { memo, useState } from 'react';

import SidePanelParentRoom from './SidePanelParentRoom';
import { useShortTimeAgo } from '../../../../hooks/useTimeAgo';
import { useItemData } from '../hooks/useItemData';

type SidepanelItemProps = {
	openedRoom?: string;
	room: SubscriptionWithRoom;
	parentRid?: string;
};

const SidepanelItem = ({ room, openedRoom }: SidepanelItemProps) => {
	const { href, selected, avatar, unread, icon, title, time, badges, menu, subtitle, ...props } = useItemData(room, { openedRoom });
	const { sidebar } = useLayout();
	const formatDate = useShortTimeAgo();
	const [menuVisibility, setMenuVisibility] = useState(!!window.DISABLE_ANIMATION);

	const handleFocus = () => setMenuVisibility(true);
	const handlePointerEnter = () => setMenuVisibility(true);

	const parentRoomId = Boolean(room.prid || (room.teamId && !room.teamMain));

	return (
		<SidebarV2Item
			{...props}
			href={href}
			onClick={() => !selected && sidebar.toggle()}
			selected={selected}
			onFocus={handleFocus}
			onPointerEnter={handlePointerEnter}
		>
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

export default memo(SidepanelItem);

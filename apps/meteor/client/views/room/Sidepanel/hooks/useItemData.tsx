import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { SidebarV2ItemBadge as SidebarItemBadge, SidebarV2ItemIcon as SidebarItemIcon } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { RoomIcon } from '../../../../components/RoomIcon';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { getMessage } from '../../../../sidebarv2/RoomList/SidebarItemTemplateWithData';
import { useAvatarTemplate } from '../../../../sidebarv2/hooks/useAvatarTemplate';
import { useUnreadDisplay } from '../../../../sidebarv2/hooks/useUnreadDisplay';

export const useItemData = (
	room: ISubscription & IRoom,
	{ openedRoom, viewMode }: { openedRoom: string | undefined; viewMode?: 'extended' | 'medium' | 'condensed' },
) => {
	const { t } = useTranslation();
	const AvatarTemplate = useAvatarTemplate();

	const { unreadTitle, unreadVariant, showUnread, highlightUnread: highlighted, unreadCount } = useUnreadDisplay(room);

	const icon = useMemo(
		() => <SidebarItemIcon highlighted={highlighted} icon={<RoomIcon room={room} placement='sidebar' size='x20' />} />,
		[highlighted, room],
	);
	const time = 'lastMessage' in room ? room.lastMessage?.ts : undefined;
	const message = viewMode === 'extended' ? getMessage(room, room.lastMessage, t) : undefined;

	const badges = useMemo(
		() => (
			<>
				{showUnread && (
					<SidebarItemBadge variant={unreadVariant} title={unreadTitle} role='status'>
						{unreadCount.total}
					</SidebarItemBadge>
				)}
			</>
		),
		[showUnread, unreadCount.total, unreadTitle, unreadVariant],
	);

	const itemData = useMemo(
		() => ({
			unread: highlighted,
			selected: room.rid === openedRoom,
			href: roomCoordinator.getRouteLink(room.t, room) || '',
			title: roomCoordinator.getRoomName(room.t, room) || '',
			icon,
			time,
			badges,
			avatar: AvatarTemplate && <AvatarTemplate {...room} />,
			subtitle: message,
		}),
		[AvatarTemplate, badges, highlighted, icon, message, openedRoom, room, time],
	);

	return itemData;
};

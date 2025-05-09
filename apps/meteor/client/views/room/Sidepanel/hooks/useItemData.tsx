import { SidebarV2ItemBadge as SidebarItemBadge, SidebarV2ItemIcon as SidebarItemIcon } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { RoomIcon } from '../../../../components/RoomIcon';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { getMessage } from '../../../../sidebarv2/RoomList/SidebarItemTemplateWithData';
import { useAvatarTemplate } from '../../../../sidebarv2/hooks/useAvatarTemplate';
import { useUnreadDisplay } from '../../../../sidebarv2/hooks/useUnreadDisplay';

export const useItemData = (
	room: SubscriptionWithRoom,
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
						<span aria-hidden>{unreadCount.total}</span>
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
			subtitle: message ? <span className='message-body--unstyled' dangerouslySetInnerHTML={{ __html: message }} /> : null,
		}),
		[AvatarTemplate, badges, highlighted, icon, message, openedRoom, room, time],
	);

	return itemData;
};

import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { SidebarV2ItemBadge as SidebarItemBadge, SidebarV2ItemIcon as SidebarItemIcon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { RoomIcon } from '../../../../components/RoomIcon';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { getBadgeTitle, getMessage } from '../../../../sidebarv2/RoomList/SidebarItemTemplateWithData';
import { useAvatarTemplate } from '../../../../sidebarv2/hooks/useAvatarTemplate';

export const useItemData = (
	room: ISubscription & IRoom,
	{ openedRoom, viewMode }: { openedRoom: string | undefined; viewMode?: 'extended' | 'medium' | 'condensed' },
) => {
	const t = useTranslation();
	const AvatarTemplate = useAvatarTemplate();

	const highlighted = Boolean(!room.hideUnreadStatus && (room.alert || room.unread));

	const icon = useMemo(
		() => <SidebarItemIcon highlighted={highlighted} icon={<RoomIcon room={room} placement='sidebar' size='x20' />} />,
		[highlighted, room],
	);
	const time = 'lastMessage' in room ? room.lastMessage?.ts : undefined;
	const message = viewMode === 'extended' && getMessage(room, room.lastMessage, t);

	const threadUnread = Number(room.tunread?.length) > 0;
	const isUnread = room.unread > 0 || threadUnread;
	const showBadge =
		!room.hideUnreadStatus || (!room.hideMentionStatus && (Boolean(room.userMentions) || Number(room.tunreadUser?.length) > 0));
	const badgeTitle = getBadgeTitle(room.userMentions, Number(room.tunread?.length), room.groupMentions, room.unread, t);
	const variant =
		((room.userMentions || room.tunreadUser?.length) && 'danger') ||
		(threadUnread && 'primary') ||
		(room.groupMentions && 'warning') ||
		'secondary';

	const badges = useMemo(
		() => (
			<>
				{showBadge && isUnread && (
					<SidebarItemBadge variant={variant} title={badgeTitle}>
						{room.unread + (room.tunread?.length || 0)}
					</SidebarItemBadge>
				)}
			</>
		),
		[badgeTitle, isUnread, room.tunread?.length, room.unread, showBadge, variant],
	);

	const itemData = useMemo(
		() => ({
			unread: highlighted,
			selected: room.rid === openedRoom,
			t,
			href: roomCoordinator.getRouteLink(room.t, room) || '',
			title: roomCoordinator.getRoomName(room.t, room) || '',
			icon,
			time,
			badges,
			avatar: AvatarTemplate && <AvatarTemplate {...room} />,
			subtitle: message,
		}),
		[AvatarTemplate, badges, highlighted, icon, message, openedRoom, room, t, time],
	);

	return itemData;
};

import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { SidebarV2ItemBadge, SidebarV2ItemIcon } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import NavBarSearchItem from './NavBarSearchItem';
import { RoomIcon } from '../../components/RoomIcon';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { OmnichannelBadges } from '../../sidebarv2/badges/OmnichannelBadges';
import { useUnreadDisplay } from '../../sidebarv2/hooks/useUnreadDisplay';

type NavBarSearchItemWithDataProps = {
	room: SubscriptionWithRoom;
	id: string;
	AvatarTemplate: ReactElement;
} & Partial<ComponentProps<typeof NavBarSearchItem>>;

const NavBarSearchItemWithData = ({ room, AvatarTemplate, ...props }: NavBarSearchItemWithDataProps) => {
	const { t } = useTranslation();

	const href = roomCoordinator.getRouteLink(room.t, room) || '';
	const title = roomCoordinator.getRoomName(room.t, room) || '';

	const { unreadTitle, unreadVariant, showUnread, unreadCount, highlightUnread: highlighted } = useUnreadDisplay(room);

	const icon = <SidebarV2ItemIcon highlighted={highlighted} icon={<RoomIcon room={room} placement='sidebar' size='x20' />} />;

	const badges = (
		<>
			{showUnread && (
				<SidebarV2ItemBadge
					variant={unreadVariant}
					title={unreadTitle}
					role='status'
					aria-label={t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title })}
				>
					<span aria-hidden>{unreadCount.total}</span>
				</SidebarV2ItemBadge>
			)}
			{isOmnichannelRoom(room) && <OmnichannelBadges room={room} />}
		</>
	);

	return (
		<NavBarSearchItem
			{...props}
			unread={highlighted}
			href={href}
			aria-label={showUnread ? t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title }) : title}
			title={title}
			icon={icon}
			badges={badges}
			avatar={AvatarTemplate}
		/>
	);
};

export default NavBarSearchItemWithData;

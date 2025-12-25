import { SidebarV2ItemIcon } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import NavBarSearchItem from './NavBarSearchItem';
import { RoomIcon } from '../../components/RoomIcon';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import SidebarItemBadges from '../../sidebar/badges/SidebarItemBadges';
import { useUnreadDisplay } from '../../sidebar/hooks/useUnreadDisplay';

type NavBarSearchItemWithDataProps = {
	room: SubscriptionWithRoom;
	id: string;
	AvatarTemplate: ReactElement;
} & Partial<ComponentProps<typeof NavBarSearchItem>>;

const NavBarSearchItemWithData = ({ room, AvatarTemplate, ...props }: NavBarSearchItemWithDataProps) => {
	const { t } = useTranslation();

	const href = roomCoordinator.getRouteLink(room.t, room) || '';
	const title = roomCoordinator.getRoomName(room.t, room) || '';

	const { unreadTitle, showUnread, highlightUnread: highlighted } = useUnreadDisplay(room);

	const icon = <SidebarV2ItemIcon highlighted={highlighted} icon={<RoomIcon room={room} placement='sidebar' size='x20' />} />;

	return (
		<NavBarSearchItem
			{...props}
			unread={highlighted}
			href={href}
			aria-label={showUnread ? t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title }) : title}
			title={title}
			icon={icon}
			badges={<SidebarItemBadges room={room} roomTitle={title} />}
			avatar={AvatarTemplate}
		/>
	);
};

export default NavBarSearchItemWithData;

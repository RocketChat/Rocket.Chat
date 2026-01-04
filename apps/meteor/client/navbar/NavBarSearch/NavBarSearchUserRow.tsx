import { SidebarV2ItemIcon } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import { memo } from 'react';

import NavBarSearchItem from './NavBarSearchItem';
import { ReactiveUserStatus } from '../../components/UserStatus';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

type NavBarSearchUserRowProps = {
	room: SubscriptionWithRoom;
	id: string;
	AvatarTemplate: ReactElement;
} & Partial<ComponentProps<typeof NavBarSearchItem>>;

const NavBarSearchUserRow = ({ room, id, AvatarTemplate, ...props }: NavBarSearchUserRowProps) => {
	const useRealName = useSetting('UI_Use_Real_Name');
	const title = useRealName ? room.fname || room.name : room.name || room.fname || '';
	const icon = <SidebarV2ItemIcon icon={<ReactiveUserStatus uid={room._id} />} />;
	const href = roomCoordinator.getRouteLink(room.t, { name: room.name }) || '';

	return <NavBarSearchItem {...props} id={id} href={href} title={title} avatar={AvatarTemplate} icon={icon} />;
};

export default memo(NavBarSearchUserRow);

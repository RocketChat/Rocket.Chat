import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { SidebarV2ItemIcon } from '@rocket.chat/fuselage';
import { memo } from 'react';

import { ReactiveUserStatus } from '../../components/UserStatus';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import SidebarItem from '../RoomList/SidebarItem';

type UserItemProps = {
	item: {
		name?: string;
		fname?: string;
		_id: IUser['_id'];
		t: IRoom['t'];
	};
	id: string;
	style?: CSSStyleRule;
	useRealName?: boolean;
};

const UserItem = ({ item, id, style, useRealName }: UserItemProps) => {
	const title = useRealName ? item.fname || item.name : item.name || item.fname;
	const icon = <SidebarV2ItemIcon icon={<ReactiveUserStatus uid={item._id} />} />;
	const href = roomCoordinator.getRouteLink(item.t, { name: item.name });

	return <SidebarItem style={{ height: '100%', ...style }} id={id} href={href || undefined} title={title} icon={icon} room={item} />;
};

export default memo(UserItem);

import type { IUser } from '@rocket.chat/core-typings';
import { Sidebar } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { ReactiveUserStatus } from '../../components/UserStatus';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

type UserItemProps = {
	item: {
		name?: string;
		fname?: string;
		_id: IUser['_id'];
		t: string;
	};
	t: (value: string) => string;
	SideBarItemTemplate: any;
	AvatarTemplate: any;
	id: string;
	style?: CSSStyleRule;
	useRealName?: boolean;
};
const UserItem = ({ item, id, style, t, SideBarItemTemplate, AvatarTemplate, useRealName }: UserItemProps): ReactElement => {
	const title = useRealName ? item.fname || item.name : item.name || item.fname;
	const icon = (
		<Sidebar.Item.Icon icon={'' as any}>
			<ReactiveUserStatus uid={item._id} />
		</Sidebar.Item.Icon>
	);
	const href = roomCoordinator.getRouteLink(item.t, { name: item.name });

	return (
		<SideBarItemTemplate
			is='a'
			style={{ height: '100%', ...style }}
			id={id}
			href={href}
			title={title}
			subtitle={t('No_messages_yet')}
			avatar={AvatarTemplate && <AvatarTemplate {...item} />}
			icon={icon}
		/>
	);
};

export default memo(UserItem);

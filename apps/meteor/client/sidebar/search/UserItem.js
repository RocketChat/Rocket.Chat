import { Sidebar } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

import { ReactiveUserStatus } from '../../components/UserStatus';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

const UserItem = ({ item, id, style, t, SideBarItemTemplate, AvatarTemplate, useRealName }) => {
	const title = useRealName ? item.fname || item.name : item.name || item.fname;
	const icon = (
		<Sidebar.Item.Icon>
			<ReactiveUserStatus uid={item._id} />
		</Sidebar.Item.Icon>
	);
	const href = roomCoordinator.getRouteLink(item.t, { name: item.name });

	return (
		<SideBarItemTemplate
			is='a'
			style={{ height: '100%' }}
			id={id}
			href={href}
			title={title}
			subtitle={t('No_messages_yet')}
			avatar={AvatarTemplate && <AvatarTemplate {...item} />}
			icon={icon}
			style={style}
		/>
	);
};

export default memo(UserItem);

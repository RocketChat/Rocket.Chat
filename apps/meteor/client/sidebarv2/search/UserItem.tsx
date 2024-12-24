import type { IUser } from '@rocket.chat/core-typings';
import { SidebarV2ItemIcon } from '@rocket.chat/fuselage';
import { memo } from 'react';

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
	SidebarItemTemplate: any;
	AvatarTemplate: any;
	id: string;
	style?: CSSStyleRule;
	useRealName?: boolean;
};

const UserItem = ({ item, id, style, t, SidebarItemTemplate, AvatarTemplate, useRealName }: UserItemProps) => {
	const title = useRealName ? item.fname || item.name : item.name || item.fname;
	const icon = <SidebarV2ItemIcon icon={<ReactiveUserStatus uid={item._id} />} />;
	const href = roomCoordinator.getRouteLink(item.t, { name: item.name });

	return (
		<SidebarItemTemplate
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

import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import SidebarItemTemplateWithData from '../RoomList/SidebarItemTemplateWithData';
import UserItem from './UserItem';

type RowProps = {
	item: ISubscription & IRoom;
	data: Record<string, any>;
};

const Row = ({ item, data }: RowProps): ReactElement => {
	const { t, SidebarItemTemplate, avatarTemplate: AvatarTemplate, useRealName, extended } = data;

	if (item.t === 'd' && !item.u) {
		return (
			<UserItem
				id={`search-${item._id}`}
				useRealName={useRealName}
				t={t}
				item={item}
				SidebarItemTemplate={SidebarItemTemplate}
				AvatarTemplate={AvatarTemplate}
			/>
		);
	}
	return (
		<SidebarItemTemplateWithData
			id={`search-${item._id}`}
			extended={extended}
			t={t}
			room={item}
			SidebarItemTemplate={SidebarItemTemplate}
			AvatarTemplate={AvatarTemplate}
		/>
	);
};

export default memo(Row);

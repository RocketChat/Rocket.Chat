import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import SideBarItemTemplateWithData from '../RoomList/SideBarItemTemplateWithData';
import UserItem from './UserItem';

type RowProps = {
	item: ISubscription & IRoom;
	data: Record<string, any>;
};

const Row = ({ item, data }: RowProps): ReactElement => {
	const { t, SideBarItemTemplate, avatarTemplate: AvatarTemplate, useRealName, extended } = data;

	if (item.t === 'd' && !item.u) {
		return (
			<UserItem
				id={`search-${item._id}`}
				useRealName={useRealName}
				t={t}
				item={item}
				SideBarItemTemplate={SideBarItemTemplate}
				AvatarTemplate={AvatarTemplate}
			/>
		);
	}
	return (
		<SideBarItemTemplateWithData
			id={`search-${item._id}`}
			extended={extended}
			t={t}
			room={item}
			SideBarItemTemplate={SideBarItemTemplate}
			AvatarTemplate={AvatarTemplate}
		/>
	);
};

export default memo(Row);

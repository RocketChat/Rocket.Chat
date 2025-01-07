import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo } from 'react';

import UserItem from './UserItem';
import SidebarItemTemplateWithData from '../RoomList/SidebarItemTemplateWithData';

type RowProps = {
	item: SubscriptionWithRoom;
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

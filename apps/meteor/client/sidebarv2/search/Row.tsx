import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo } from 'react';

import UserItem from './UserItem';
import SidebarItemWithData from '../RoomList/SidebarItemWithData';

type RowProps = {
	item: SubscriptionWithRoom;
	data: Record<string, any>;
};

const Row = ({ item, data }: RowProps): ReactElement => {
	const { useRealName, t } = data;

	if (item.t === 'd') {
		return <UserItem id={`search-${item._id}`} useRealName={useRealName} item={item} />;
	}
	return <SidebarItemWithData id={`search-${item._id}`} t={t} room={item} />;
};

export default memo(Row);

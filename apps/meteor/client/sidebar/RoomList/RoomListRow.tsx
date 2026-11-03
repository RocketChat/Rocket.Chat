import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import { memo } from 'react';

import SidebarItemTemplateWithData from './SidebarItemTemplateWithData';
import type { RoomListItemViewMode } from '../../components/RoomListItem/RoomListItem';
import type { RingingCallActions } from '../hooks/useRingingCalls';

export type RoomListRowProps = {
	data: {
		t: TFunction;
		viewMode: RoomListItemViewMode;
		showAvatar: boolean;
		openedRoom: string;
		isAnonymous: boolean;
		userId?: string;
	};
	item: SubscriptionWithRoom;
	/** Present only while this room's call is ringing and this list is where it is answered. */
	videoConfActions?: RingingCallActions;
};

const RoomListRow = ({ data, item, videoConfActions }: RoomListRowProps) => {
	const { t, viewMode, showAvatar, openedRoom, userId } = data;

	return (
		<SidebarItemTemplateWithData
			viewMode={viewMode}
			showAvatar={showAvatar}
			selected={item.rid === openedRoom}
			t={t}
			room={item}
			videoConfActions={videoConfActions}
			userId={userId}
		/>
	);
};

export default memo(RoomListRow);

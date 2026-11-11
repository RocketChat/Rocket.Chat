import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import { memo } from 'react';

import SidebarItemTemplateWithData from './SidebarItemTemplateWithData';
import type { RoomListItemViewMode } from '../../components/RoomListItem/RoomListItem';
import { useIsOpenedRoom } from '../../lib/RoomManager';
import type { RingingCallActions } from '../hooks/useRingingCalls';

export type RoomListRowProps = {
	data: {
		t: TFunction;
		viewMode: RoomListItemViewMode;
		showAvatar: boolean;
		formatTime: (time: Date | string) => string;
		isAnonymous: boolean;
		userId?: string;
	};
	item: SubscriptionWithRoom;
	/** Present only while this room's call is ringing and this list is where it is answered. */
	videoConfActions?: RingingCallActions;
	dragging?: boolean;
};

const RoomListRow = ({ data, item, videoConfActions, dragging }: RoomListRowProps) => {
	const { t, viewMode, showAvatar, formatTime, userId } = data;
	const selected = useIsOpenedRoom(item.rid);

	return (
		<SidebarItemTemplateWithData
			viewMode={viewMode}
			showAvatar={showAvatar}
			formatTime={formatTime}
			selected={selected}
			t={t}
			room={item}
			videoConfActions={videoConfActions}
			userId={userId}
			dragging={dragging}
		/>
	);
};

export default memo(RoomListRow);

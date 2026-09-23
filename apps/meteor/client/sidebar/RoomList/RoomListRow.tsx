import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import { memo } from 'react';

import SidebarItemTemplateWithData from './SidebarItemTemplateWithData';
import type { SidebarItemTemplate, SidebarRoomAvatar } from '../Item/templates';
import type { RoomListCallActions } from '../contexts/RoomListContext';

export type RoomListRowProps = {
	data: {
		extended: boolean;
		t: TFunction;
		SidebarItemTemplate: SidebarItemTemplate;
		AvatarTemplate: SidebarRoomAvatar | null;
		formatTime: (time: string | Date | number) => string;
		isPriorityEnabled: boolean;
		openedRoom: string;
		sidebarViewMode: 'extended' | 'condensed' | 'medium';
		isAnonymous: boolean;
		userId?: string;
	};
	item: SubscriptionWithRoom;
	/** Present only while this room's call is ringing and this list is where it is answered. */
	videoConfActions?: RoomListCallActions;
};

const RoomListRow = ({ data, item, videoConfActions }: RoomListRowProps) => {
	const { extended, t, SidebarItemTemplate, AvatarTemplate, openedRoom, sidebarViewMode, userId, formatTime, isPriorityEnabled } = data;

	return (
		<SidebarItemTemplateWithData
			sidebarViewMode={sidebarViewMode}
			selected={item.rid === openedRoom}
			t={t}
			room={item}
			extended={extended}
			SidebarItemTemplate={SidebarItemTemplate}
			formatTime={formatTime}
			isPriorityEnabled={isPriorityEnabled}
			AvatarTemplate={AvatarTemplate}
			videoConfActions={videoConfActions}
			userId={userId}
		/>
	);
};

export default memo(RoomListRow);

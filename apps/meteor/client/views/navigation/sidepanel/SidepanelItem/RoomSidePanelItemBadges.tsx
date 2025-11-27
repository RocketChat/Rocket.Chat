import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import UnreadBadge from '../../../../sidebarv2/badges/UnreadBadge';
import { useUnreadDisplay } from '../../../../sidebarv2/hooks/useUnreadDisplay';
import SidePanelOmnichannelBadges from '../omnichannel/SidePanelOmnichannelBadges';

type RoomSidePanelItemBadgesProps = {
	room: SubscriptionWithRoom;
	roomTitle?: string;
};

const RoomSidePanelItemBadges = ({ room, roomTitle }: RoomSidePanelItemBadgesProps) => {
	const { unreadCount, unreadTitle, unreadVariant, showUnread } = useUnreadDisplay(room);

	return (
		<>
			{isOmnichannelRoom(room) && <SidePanelOmnichannelBadges room={room} />}

			{showUnread && <UnreadBadge title={unreadTitle} roomTitle={roomTitle} variant={unreadVariant} total={unreadCount.total} />}
		</>
	);
};

export default RoomSidePanelItemBadges;

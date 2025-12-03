import { isInviteSubscription } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import InvitationBadge from './InvitationBadge';
import UnreadBadge from '../../../../sidebarv2/badges/UnreadBadge';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type SidebarItemBadgesProps = {
	room: SubscriptionWithRoom;
	roomTitle?: string;
};

const SidebarItemBadges = ({ room, roomTitle }: SidebarItemBadgesProps) => {
	const { unreadCount, unreadTitle, unreadVariant, showUnread } = useUnreadDisplay(room);

	return (
		<>
			{showUnread && <UnreadBadge title={unreadTitle} roomTitle={roomTitle} variant={unreadVariant} total={unreadCount.total} />}

			{isInviteSubscription(room) && <InvitationBadge inviteDate={room.ts.toISOString()} />}
		</>
	);
};

export default SidebarItemBadges;

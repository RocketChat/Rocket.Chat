import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { isInviteSubscription, isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

import UnreadBadge from './UnreadBadge';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

export type SidebarItemBadgesProps = {
	room: SubscriptionWithRoom;
	roomTitle?: string;
	/** Badges belonging to a part of the product this list knows nothing about; when they apply is decided here. */
	renderOmnichannelBadges?: (room: SubscriptionWithRoom & IOmnichannelRoom) => ReactNode;
	renderInvitationBadge?: (invitationDate: Date) => ReactNode;
};

const SidebarItemBadges = ({ room, roomTitle, renderOmnichannelBadges, renderInvitationBadge }: SidebarItemBadgesProps) => {
	const { unreadCount, unreadTitle, unreadVariant, showUnread } = useUnreadDisplay(room);

	return (
		<>
			{showUnread && <UnreadBadge title={unreadTitle} roomTitle={roomTitle} variant={unreadVariant} total={unreadCount.total} />}
			{isOmnichannelRoom(room) && renderOmnichannelBadges?.(room)}
			{isInviteSubscription(room) && renderInvitationBadge?.(room.ts)}
		</>
	);
};

export default SidebarItemBadges;

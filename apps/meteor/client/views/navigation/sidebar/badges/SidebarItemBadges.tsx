import { isInviteSubscription, isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import UnreadBadge from './UnreadBadge';
import InvitationBadge from '../../../../components/InvitationBadge';
import OmnichannelBadges from '../../../omnichannel/components/OmnichannelBadges';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

export type SidebarItemBadgesProps = {
	room: SubscriptionWithRoom;
	roomTitle?: string;
	/** Adds the omnichannel badges, for lists that show omnichannel rooms next to the others. */
	showOmnichannelBadges?: boolean;
};

const SidebarItemBadges = ({ room, roomTitle, showOmnichannelBadges = false }: SidebarItemBadgesProps) => {
	const { unreadCount, unreadTitle, unreadVariant, showUnread } = useUnreadDisplay(room);

	return (
		<>
			{showUnread && <UnreadBadge title={unreadTitle} roomTitle={roomTitle} variant={unreadVariant} total={unreadCount.total} />}
			{showOmnichannelBadges && isOmnichannelRoom(room) && <OmnichannelBadges room={room} />}
			{isInviteSubscription(room) && <InvitationBadge marginBlockStart={2} invitationDate={room.ts} />}
		</>
	);
};

export default SidebarItemBadges;

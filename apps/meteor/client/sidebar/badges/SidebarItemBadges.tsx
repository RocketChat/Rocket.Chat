import { isOmnichannelRoom, isInviteSubscription } from '@rocket.chat/core-typings';
import { Margins } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import InvitationBadge from './InvitationBadge';
import UnreadBadge from './UnreadBadge';
import OmnichannelBadges from '../../views/omnichannel/components/OmnichannelBadges';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type SidebarItemBadgesProps = {
	room: SubscriptionWithRoom;
	roomTitle?: string;
};

const SidebarItemBadges = ({ room, roomTitle }: SidebarItemBadgesProps) => {
	const { unreadCount, unreadTitle, unreadVariant, showUnread } = useUnreadDisplay(room);

	return (
		<Margins inlineStart={8}>
			{showUnread && <UnreadBadge title={unreadTitle} roomTitle={roomTitle} variant={unreadVariant} total={unreadCount.total} />}
			{isOmnichannelRoom(room) && <OmnichannelBadges room={room} />}
			{isInviteSubscription(room) && <InvitationBadge inviteDate={room.ts.toISOString()} />}
		</Margins>
	);
};

export default SidebarItemBadges;

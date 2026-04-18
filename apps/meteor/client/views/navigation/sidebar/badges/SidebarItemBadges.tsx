import { isInviteSubscription } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import UnreadBadge from './UnreadBadge';
import DraftBadge from '../../../../sidebar/badges/DraftBadge';
import InvitationBadge from '../../../../components/InvitationBadge';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';
import { useRoomDraft } from '../../../../sidebar/hooks/useRoomDraft';

type SidebarItemBadgesProps = {
	room: SubscriptionWithRoom;
	roomTitle?: string;
};

const SidebarItemBadges = ({ room, roomTitle }: SidebarItemBadgesProps) => {
	const { unreadCount, unreadTitle, unreadVariant, showUnread } = useUnreadDisplay(room);
	const showDraft = useRoomDraft(room.rid);

	return (
		<>
			{showUnread && <UnreadBadge title={unreadTitle} roomTitle={roomTitle} variant={unreadVariant} total={unreadCount.total} />}
			{isInviteSubscription(room) && <InvitationBadge mbs={2} invitationDate={room.ts} />}
			{showDraft && <DraftBadge roomTitle={roomTitle} />}
		</>
	);
};

export default SidebarItemBadges;

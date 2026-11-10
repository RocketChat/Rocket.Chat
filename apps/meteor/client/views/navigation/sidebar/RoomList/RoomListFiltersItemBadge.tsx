import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import UnreadBadge from '../badges/UnreadBadge';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

export type RoomListFiltersItemBadgeProps = {
	roomTitle: string;
	unreadGroupCount: Pick<
		SubscriptionWithRoom,
		'alert' | 'userMentions' | 'unread' | 'tunread' | 'tunreadUser' | 'groupMentions' | 'hideMentionStatus' | 'hideUnreadStatus'
	>;
};

const RoomListFiltersItemBadge = ({ roomTitle, unreadGroupCount }: RoomListFiltersItemBadgeProps) => {
	const { unreadTitle, unreadVariant, unreadCount } = useUnreadDisplay(unreadGroupCount);

	return <UnreadBadge title={unreadTitle} roomTitle={roomTitle} variant={unreadVariant} total={unreadCount.total} />;
};

export default RoomListFiltersItemBadge;

import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { isInviteSubscription, isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

import UnreadBadge from './UnreadBadge';
import type { UnreadVariant } from '../lib/unreadDisplay';

export type SidebarItemBadgesProps = {
	room: SubscriptionWithRoom;
	/** Already worked out by whoever draws the list, so a long list settles the unread rules once per row and not once per badge. */
	unread: { show: boolean; title: string; label: string; total: number; variant: UnreadVariant };
	/** Badges belonging to a part of the product this list knows nothing about; when they apply is decided here. */
	renderOmnichannelBadges?: (room: SubscriptionWithRoom & IOmnichannelRoom) => ReactNode;
	renderInvitationBadge?: (invitationDate: Date) => ReactNode;
};

const SidebarItemBadges = ({ room, unread, renderOmnichannelBadges, renderInvitationBadge }: SidebarItemBadgesProps) => (
	<>
		{unread.show && <UnreadBadge title={unread.title} label={unread.label} variant={unread.variant} total={unread.total} />}
		{isOmnichannelRoom(room) && renderOmnichannelBadges?.(room)}
		{isInviteSubscription(room) && renderInvitationBadge?.(room.ts)}
	</>
);

export default SidebarItemBadges;

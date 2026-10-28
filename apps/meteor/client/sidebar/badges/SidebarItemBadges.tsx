import { isInviteSubscription, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { MouseEventHandler } from 'react';

import UnreadBadge from './UnreadBadge';
import InvitationBadge from '../../components/InvitationBadge';
import OmnichannelBadges from '../../views/omnichannel/components/OmnichannelBadges';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

export type SidebarItemBadgesProps = {
	room: SubscriptionWithRoom;
	roomTitle?: string;
	href?: string;
	onClick?: MouseEventHandler<HTMLElement>;
};

const SidebarItemBadges = ({ room, roomTitle, href, onClick }: SidebarItemBadgesProps) => {
	const { unreadCount, unreadTitle, unreadVariant, showUnread } = useUnreadDisplay(room);

	return (
		<>
			{showUnread && (
				<UnreadBadge
					title={unreadTitle}
					roomTitle={roomTitle}
					variant={unreadVariant}
					total={unreadCount.total}
					href={href}
					onClick={onClick}
				/>
			)}
			{isOmnichannelRoom(room) && <OmnichannelBadges room={room} />}
			{isInviteSubscription(room) && (
				<Box display='flex' marginBlockStart='x4'>
					<InvitationBadge invitationDate={room.ts} />
				</Box>
			)}
		</>
	);
};

export default SidebarItemBadges;

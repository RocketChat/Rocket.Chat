import { UserStatus } from '@rocket.chat/core-typings';

import type { IncomingPresence } from '../../events';

type OutgoingPresence = { availability: 'available' | 'unavailable'; show?: 'away' | 'chat' | 'dnd' | 'xa' };

/** Maps a Rocket.Chat user status to an XMPP presence availability/show. */
export function mapStatusToPresence(status: UserStatus | undefined): OutgoingPresence {
	switch (status) {
		case UserStatus.ONLINE:
			return { availability: 'available' };
		case UserStatus.AWAY:
			return { availability: 'available', show: 'away' };
		case UserStatus.BUSY:
			return { availability: 'available', show: 'dnd' };
		default:
			return { availability: 'unavailable' };
	}
}

/** Maps an inbound XMPP presence to a Rocket.Chat user status. */
export function mapPresenceToStatus(presence: Pick<IncomingPresence, 'availability' | 'show'>): UserStatus {
	if (presence.availability === 'unavailable') {
		return UserStatus.OFFLINE;
	}
	switch (presence.show) {
		case 'away':
		case 'xa':
			return UserStatus.AWAY;
		case 'dnd':
			return UserStatus.BUSY;
		default:
			return UserStatus.ONLINE;
	}
}

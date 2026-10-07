import type { BadgeProps } from '@rocket.chat/fuselage';

import { useRoomSubscription } from '../contexts/RoomContext';

const getVariant = (tunreadUser: number, tunreadGroup: number): BadgeProps['variant'] => {
	if (tunreadUser > 0) {
		return 'danger';
	}

	if (tunreadGroup > 0) {
		return 'warning';
	}

	return 'primary';
};

/**
 * How many of the room's threads have unread replies, and the badge variant that says whether any of them
 * mention the user directly or through a group mention. `undefined` when there is nothing unread.
 */
export const useThreadsUnreadBadge = (): { label: number | '99+'; variant: BadgeProps['variant'] } | undefined => {
	const subscription = useRoomSubscription();

	const tunread = subscription?.tunread?.length ?? 0;
	const tunreadUser = subscription?.tunreadUser?.length ?? 0;
	const tunreadGroup = subscription?.tunreadGroup?.length ?? 0;

	if (!tunread) {
		return undefined;
	}

	return {
		label: tunread > 99 ? '99+' : tunread,
		variant: getVariant(tunreadUser, tunreadGroup),
	};
};

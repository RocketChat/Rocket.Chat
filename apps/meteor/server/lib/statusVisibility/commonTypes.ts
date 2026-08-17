import type { PresenceStatusCode } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';

// TODO: Export it from core-typings or appropriate place
export const STATUS_MAP: Record<UserStatus, PresenceStatusCode> = {
	[UserStatus.OFFLINE]: 0,
	[UserStatus.ONLINE]: 1,
	[UserStatus.AWAY]: 2,
	[UserStatus.BUSY]: 3,
	[UserStatus.DISABLED]: 0,
} as const;

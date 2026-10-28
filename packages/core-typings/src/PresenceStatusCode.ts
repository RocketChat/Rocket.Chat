import { UserStatus } from './UserStatus';

export type PresenceStatusCode = 0 | 1 | 2 | 3;

export const USER_STATUS_TO_PRESENCE_CODE: Record<UserStatus, PresenceStatusCode> = {
	[UserStatus.OFFLINE]: 0,
	[UserStatus.ONLINE]: 1,
	[UserStatus.AWAY]: 2,
	[UserStatus.BUSY]: 3,
	[UserStatus.DISABLED]: 0,
} as const;

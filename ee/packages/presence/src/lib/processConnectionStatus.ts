import { UserStatus } from '@rocket.chat/core-typings';

/**
 * Defines new connection status compared to a previous connection status
 */
export const processConnectionStatus = (current: UserStatus, status: UserStatus): UserStatus => {
	if (current === UserStatus.ONLINE) {
		return UserStatus.ONLINE;
	}
	if (status !== UserStatus.OFFLINE) {
		return status;
	}
	return current;
};

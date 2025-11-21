import { UserStatus } from '@rocket.chat/core-typings';

/**
 * Defines user's status based on presence and connection status
 */
export const processStatus = (statusConnection: UserStatus, statusDefault: UserStatus): UserStatus => {
	if (statusConnection === UserStatus.OFFLINE) {
		return statusConnection;
	}

	if (statusDefault === UserStatus.ONLINE) {
		return statusConnection;
	}

	return statusDefault;
};

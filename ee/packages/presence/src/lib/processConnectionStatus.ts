import { UserStatus, type IUserSessionConnection } from '@rocket.chat/core-typings';

import { STALE_THRESHOLD } from './constants';

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

const isFresh = (updatedAt: Date): boolean => {
	return Date.now() - updatedAt.getTime() <= STALE_THRESHOLD;
};

/**
 * Defines user's status and connection status based on user's connections and default status
 */
export const processPresenceAndStatus = (
	userSessions: IUserSessionConnection[] = [],
	statusDefault = UserStatus.ONLINE,
): { status: UserStatus; statusConnection: UserStatus } => {
	const statusConnection = userSessions
		.filter((c) => isFresh(c._updatedAt))
		.map((s) => s.status)
		.reduce(processConnectionStatus, UserStatus.OFFLINE);

	const status = processStatus(statusConnection, statusDefault);

	return {
		status,
		statusConnection,
	};
};

import type { IUserSessionConnection } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';

import { processConnectionStatus } from './lib/processConnectionStatus';
import { processStatus } from './lib/processStatus';

const isAtMostFiveMinutesAgo = (userSession: IUserSessionConnection): boolean => {
	const now = Date.now();
	const diff = now - userSession._updatedAt.getTime();
	return diff <= 300_000; // 5 minutes in milliseconds
};

/**
 * Defines user's status and connection status based on user's connections and default status
 */
export const processPresenceAndStatus = (
	userSessions: IUserSessionConnection[] = [],
	statusDefault = UserStatus.ONLINE,
): { status: UserStatus; statusConnection: UserStatus } => {
	const statusConnection = userSessions
		.filter(isAtMostFiveMinutesAgo)
		.map((s) => s.status)
		.reduce(processConnectionStatus, UserStatus.OFFLINE);

	const status = processStatus(statusConnection, statusDefault);

	return {
		status,
		statusConnection,
	};
};

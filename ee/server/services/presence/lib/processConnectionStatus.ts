import { IUserSessionConnection } from '../../../../../definition/IUserSession';
import { UserStatus } from '../../../../../definition/UserStatus';

export const processConnectionStatus = (current: UserStatus, status: UserStatus): UserStatus => {
	if (status === UserStatus.ONLINE) {
		return UserStatus.ONLINE;
	}
	if (status !== UserStatus.OFFLINE) {
		return status;
	}
	return current;
};

export const processStatus = (statusConnection: UserStatus, statusDefault: UserStatus): UserStatus =>
	statusConnection !== UserStatus.OFFLINE ? statusDefault : statusConnection;

export const processPresenceAndStatus = (
	userSessions: IUserSessionConnection[] = [],
	statusDefault = UserStatus.ONLINE,
): { status: UserStatus; statusConnection: UserStatus } => {
	const statusConnection = userSessions.map((s) => s.status).reduce(processConnectionStatus, UserStatus.OFFLINE);
	const status = processStatus(statusConnection, statusDefault);
	return {
		status,
		statusConnection,
	};
};

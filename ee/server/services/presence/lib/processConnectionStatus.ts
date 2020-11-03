import { IUserSessionConnection } from '../../../../../definition/IUserSession';
import { USER_STATUS } from '../../../../../definition/UserStatus';

export const processConnectionStatus = (current: USER_STATUS, status: USER_STATUS): USER_STATUS => {
	if (status === USER_STATUS.ONLINE) {
		return USER_STATUS.ONLINE;
	}
	if (status !== USER_STATUS.OFFLINE) {
		return status;
	}
	return current;
};

export const processStatus = (statusConnection: USER_STATUS, statusDefault: USER_STATUS): USER_STATUS => (
	statusConnection !== USER_STATUS.OFFLINE ? statusDefault : statusConnection
);

export const processPresenceAndStatus = (userSessions: IUserSessionConnection[] = [], statusDefault = USER_STATUS.ONLINE): {status: USER_STATUS; statusConnection: USER_STATUS} => {
	const statusConnection = userSessions.map((s) => s.status).reduce(processConnectionStatus, USER_STATUS.OFFLINE);
	const status = processStatus(statusConnection, statusDefault);
	return {
		status,
		statusConnection,
	};
};

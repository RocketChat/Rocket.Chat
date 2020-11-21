import { IUserSessionConnection } from '../../../../../definition/IUserSession';
import { USER_STATUS } from '../../../../../definition/UserStatus';
import { processUserStatus } from '../../../../../server/modules/presence/presence.module';

export const processConnectionStatus = (statusConnection: USER_STATUS, statusDefault: USER_STATUS): USER_STATUS => (
	statusConnection !== USER_STATUS.OFFLINE ? statusDefault : statusConnection
);

export const processPresenceAndStatus = (userSessions: IUserSessionConnection[] = [], statusDefault = USER_STATUS.ONLINE): {status: USER_STATUS; statusConnection: USER_STATUS} => {
	const statusConnection = userSessions.map((s) => s.status)
		.reduce((current, status) => processUserStatus(current, status).status, USER_STATUS.OFFLINE);
	const status = processConnectionStatus(statusConnection, statusDefault);
	return {
		status,
		statusConnection,
	};
};

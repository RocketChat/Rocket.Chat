// import { afterAll } from '../hooks';
import { processPresenceAndStatus } from '../lib/processConnectionStatus';
import { getCollection, Collections } from '../../mongo';
import { UsersSessionsRaw } from '../../../../../app/models/server/raw/UsersSessions';
import { IUserSession } from '../../../../../definition/IUserSession';
import { UsersRaw } from '../../../../../app/models/server/raw/Users';
import { IUser } from '../../../../../definition/IUser';
import { USER_STATUS } from '../../../../../definition/UserStatus';
import { api } from '../../../../../server/sdk/api';
import { handleUserPresenceAndStatus } from '../../../../../server/modules/presence/presence.module';

const projection = {
	projection: {
		username: 1,
		statusDefault: 1,
		statusText: 1,
	},
};

export async function updateUserPresence(uid: string): Promise<void> {
	const query = { _id: uid };

	const UserSession = new UsersSessionsRaw(await getCollection<IUserSession>(Collections.UserSession));
	const Users = new UsersRaw(await getCollection<IUser>(Collections.User));

	const user = await Users.findOne(query, projection);
	if (!user) { return; }

	const userSessions = await UserSession.findOne(query) || { connections: [], metadata: undefined };

	// if (userSessions.metadata?.visitor) {
	// 	api.broadcast('visitopresence', {
	// 		action: 'updated',
	// 		// user: { _id: uid, username: user.username, status, statusText: user.statusText },
	// 		metadata: userSessions.metadata,
	// 	});
	// 	return;
	// }

	const result = await handleUserPresenceAndStatus({
		models: {
			Users,
		},
		userId: uid,
		statusProcessor: (_current: USER_STATUS, status: USER_STATUS) => processPresenceAndStatus(userSessions.connections, status),

	});

	if (result.modifiedCount > 0) {
		api.broadcast('presence.status', {
			user: { _id: uid, username: user.username, status, statusText: user.statusText },
			metadata: userSessions.metadata,
		});
	}
}

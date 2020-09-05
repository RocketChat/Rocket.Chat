// import { afterAll } from '../hooks';
import { processPresenceAndStatus } from '../lib/processConnectionStatus';
import { getCollection, Collections } from '../../mongo';
import { IUserSession } from '../../../../../definition/IUserSession';
import { IUser } from '../../../../../definition/IUser';
import { USER_STATUS } from '../../../../../definition/UserStatus';

// export default afterAll;

const projection = {
	projection: {
		statusDefault: 1,
	},
};

export async function updateUserPresence(uid: string): Promise<void> {
	const query = { _id: uid };

	const UserSession = await getCollection<IUserSession>(Collections.UserSession);
	const User = await getCollection<IUser>(Collections.User);

	const user = await User.findOne<IUser>(query, projection);
	if (!user) { return; }

	const userSessions = await UserSession.findOne(query) || { connections: [] };
	const { statusDefault = USER_STATUS.OFFLINE } = user;
	const { status, statusConnection } = processPresenceAndStatus(userSessions.connections, statusDefault);
	User.updateOne(query, {
		$set: { status, statusConnection },
	});
}

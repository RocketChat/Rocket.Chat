import { processPresenceAndStatus } from '../lib/processConnectionStatus';
import { getCollection, Collections } from '../../mongo';
import { USER_STATUS } from '../../../../../definition/UserStatus';
import { IUserSession } from '../../../../../definition/IUserSession';

export async function setStatus(uid: string, statusDefault: USER_STATUS, statusText?: string): Promise<boolean> {
	const query = { _id: uid };

	const UserSession = await getCollection<IUserSession>(Collections.UserSession);
	const userSessions = await UserSession.findOne(query) || { connections: [] };

	const { status, statusConnection } = processPresenceAndStatus(userSessions.connections, statusDefault);

	const update = {
		statusDefault,
		status,
		statusConnection,
		...typeof statusText !== 'undefined' ? {
			// TODO logic duplicated from Rocket.Chat core
			statusText: String(statusText || '').trim().substr(0, 120),
		} : {},
	};

	const User = await getCollection(Collections.User);
	const result = await User.updateOne(
		query,
		{
			$set: update,
		},
	);

	return !!result.modifiedCount;
}

export async function setConnectionStatus(uid: string, status: USER_STATUS, session: string): Promise<boolean> {
	const query = {
		_id: uid,
		'connections.id': session,
	};

	const now = new Date();

	const update = {
		$set: {
			'connections.$.status': status,
			'connections.$._updatedAt': now,
		},
	};

	const UserSession = await getCollection(Collections.UserSession);
	const result = await UserSession.updateOne(query, update);

	return !!result.modifiedCount;
}

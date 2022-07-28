import { getCollection, Collections } from '../../mongo';

export async function removeConnection(uid: string, session: string): Promise<{ uid: string; session: string }> {
	const query = {
		'connections.id': session,
	};

	const update = {
		$pull: {
			connections: {
				id: session,
			},
		},
	};

	const UserSession = await getCollection(Collections.UserSession);
	await UserSession.updateMany(query, update);

	return {
		uid,
		session,
	};
}

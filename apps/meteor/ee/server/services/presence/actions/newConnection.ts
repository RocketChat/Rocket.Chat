import { getCollection, Collections } from '../../mongo';
import { IServiceContext } from '../../../../../server/sdk/types/ServiceClass';

const status = 'online';

export async function newConnection(
	uid: string,
	session: string,
	context?: IServiceContext,
): Promise<{ uid: string; connectionId: string } | undefined> {
	const instanceId = context?.nodeID;

	if (!instanceId) {
		return;
	}

	const query = {
		_id: uid,
	};

	const now = new Date();

	const update = {
		$push: {
			connections: {
				id: session,
				instanceId,
				status,
				_createdAt: now,
				_updatedAt: now,
			},
		},
	};

	// if (metadata) {
	// 	update.$set = {
	// 		metadata: metadata
	// 	};
	// 	connection.metadata = metadata;
	// }

	const UserSession = await getCollection(Collections.UserSession);
	await UserSession.updateOne(query, update, { upsert: true });

	return {
		uid,
		connectionId: session,
	};
}

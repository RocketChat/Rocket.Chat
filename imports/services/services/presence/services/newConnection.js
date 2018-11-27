import { UsersSessionsRaw } from '../../../../presence/server/model';

export async function newConnection(ctx) {
	const { userId, connection } = ctx.params;

	const status = 'online';

	const query = {
		_id: userId,
	};

	const now = new Date();

	// const instanceId = InstanceStatus.id();
	const instanceId = ctx.nodeID;

	const update = {
		$push: {
			connections: {
				id: connection.id,
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

	// make sure closed connections are being created
	if (!connection.closed) {
		await UsersSessionsRaw.updateOne(query, update, { upsert: true });
	}

	return {
		userId,
		connectionId: connection.id,
	};
}

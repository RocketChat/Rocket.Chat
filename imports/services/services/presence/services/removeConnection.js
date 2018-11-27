import { UsersSessionsRaw } from '../../../../presence/server/model';

export async function removeConnection(ctx) {
	const { userId, connectionId } = ctx.params;

	const query = {
		'connections.id': connectionId,
	};

	const update = {
		$pull: {
			connections: {
				id: connectionId,
			},
		},
	};

	await UsersSessionsRaw.updateMany(query, update);

	return {
		userId,
		connectionId,
	};
}

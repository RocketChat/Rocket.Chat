export async function removeConnection(ctx) {
	const { uid, connectionId } = ctx.params;


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

	await this.userSession().updateMany(query, update);

	return {
		uid,
		connectionId,
	};
}

async function getAffectedUsers(model, query) {
	const list = await model.find(query, { projection: { _id: 1 } }).toArray();

	return list.map(({ _id }) => _id);
}

export async function removeLostConnections(ctx) {
	const { nodeID } = ctx.params;
	if (nodeID) {
		const query = {
			'connections.instanceId': nodeID,
		};
		const update = {
			$pull: {
				connections: {
					instanceId: nodeID,
				},
			},
		};
		const affectedUsers = await getAffectedUsers(this.userSession(), query);

		await this.userSession().updateMany(query, update);

		return { affectedUsers };
	}

	const nodes = await ctx.call('$node.list');

	const ids = nodes.filter((node) => node.available).map(({ _id }) => _id);

	const affectedUsers = await getAffectedUsers(this.userSession(), {
		'connections.instanceId': {
			$nin: ids,
		},
	});

	const update = {
		$pull: {
			connections: {
				instanceId: {
					$nin: ids,
				},
			},
		},
	};

	await this.userSession().updateMany({}, update);

	return { affectedUsers };
}

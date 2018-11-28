export default {
	async removeLostConnections(ctx) {
		const nodes = await ctx.call('$node.list');

		const ids = nodes.filter((node) => node.available).map(({ _id }) => _id);

		const update = {
			$pull: {
				connections: {
					instanceId: {
						$nin: ids,
					},
				},
			},
		};

		this.userSession().update({}, update, { multi: true });
	},
};

export async function afterAll(ctx, res) {
	const { uid } = res;
	const key = { _id: uid };
	const userSession = await this.userSession().findOne(key);

	const status = !userSession ? 'offline' : userSession.connections.reduce((current, { status }) => {
		if (status === 'online') {
			return 'online';
		}
		if (status !== 'offline') {
			return status;
		}
		return current;
	}, 'offline');

	await this.user().updateOne(key, {
		$set: {
			status,
		},
	});

	return res;
}

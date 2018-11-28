export async function afterAll(ctx) {

	const { uid } = ctx.params;

	const key = { _id: uid };


	const userSession = await this.userSession().findOne(key);

	const connection = !userSession ? 'offline' : userSession.connections.reduce((current, { status }) => {
		if (status === 'online') {
			return 'online';
		}
		if (status !== 'offline') {
			return status;
		}
		return current;
	}, 'offline');

	const user = await this.user().findOne(key);
	if (!user) { return ; }
	const { statusDefault = connection } = user;

	await this.user().updateOne(key, {
		$set: {
			status: connection === 'online' ? statusDefault : connection,
		},
	});

	return true;
}

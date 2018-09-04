export default function onLoginCallbackHandler(info) {
	const { peer } = this;

	const { user } = info;

	if (!user) {
		return;
	}

	user.status = 'online';
	user.statusConnection = 'online';

	try {
		this.request('PUT', '/users', {
			users: [user],
			peer,
		});
	} catch (err) {
		console.log('[federation] Error sending user to hub');
		return;
	}

	console.log('[federation] Sent user to peer');
}

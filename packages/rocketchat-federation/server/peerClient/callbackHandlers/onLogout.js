export default function onLogoutCallbackHandler(info) {
	const { peer } = this;

	const { user } = info;

	if (!user) {
		return;
	}

	user.status = 'offline';
	user.statusConnection = 'offline';

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

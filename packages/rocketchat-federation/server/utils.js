export function upsertLocalUser(user) {
	const { _id, name, username, peer } = user;

	const userQuery = {
		_id,
		'peer._id': peer._id,
	};

	user.name = `${ name }@${ peer.identifier }`;
	user.username = `${ username }@${ peer.identifier }`;
	user.roles = ['user'];

	RocketChat.models.Users.upsert(userQuery, user);
}

export function upsertLocalUsers(users) {
	for (const user of users) {
		upsertLocalUser(user);
	}
}

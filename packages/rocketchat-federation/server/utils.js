//
// upsertLocalPeerUser
//
export function upsertLocalPeerUser(user) {
	const { _id, name, username, peer } = user;

	user.name = `${ name }@${ peer._id }`;
	user.username = `${ username }@${ peer._id }`;
	user.roles = ['user'];

	RocketChat.models.Users.upsert({ _id }, user);
}

//
// upsertLocalPeerUsers
//
export function upsertLocalPeerUsers(users) {
	for (const user of users) {
		upsertLocalPeerUser(user);
	}
}

//
// getRoomUsers
//
export function getRoomUsers(roomInfo) {
	const { _id: rid } = roomInfo;

	const subscriptions = RocketChat.models.Subscriptions.findByRoomIdWhenUsernameExists(rid, { fields: { 'u._id': 1 } }).fetch();
	const userIds = subscriptions.map((s) => s.u._id); // TODO: CACHE: expensive
	const options = { fields: { _id: 1, username: 1, name: 1, peer: 1 } };

	const users = RocketChat.models.Users.findUsersWithUsernameByIds(userIds, options).fetch();

	return users;
}

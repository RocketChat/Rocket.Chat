export default function createGroupSubscriptions(localPeerIdentifier, destRoom, destRoomMembers) {
	for (const destRoomMember of destRoomMembers) {
		const { username, peer } = destRoomMember;

		let usernameToSearch = username;

		// Add suffix to federated users
		if (peer._id !== localPeerIdentifier) {
			usernameToSearch = `${ usernameToSearch }@${ peer._id }`;
		}

		const member = RocketChat.models.Users.findOneByUsername(usernameToSearch, { fields: { username: 1, 'settings.preferences': 1 } });

		const extra = { open: true };

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(destRoom._id, member._id);

		if (!subscription) {
			RocketChat.models.Subscriptions.createWithRoomAndUser(destRoom, member, extra);
		}
	}
}

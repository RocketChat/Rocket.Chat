import { Migrations } from '../../migrations';
import { Users, FederationServers } from '../../../app/models/server';

Migrations.add({
	version: 143,
	up() {
		const users = Users.find({ federation: { $exists: true } }, { fields: { federation: 1 } }).fetch();

		let peers = [...new Set(users.map((u) => u.federation.peer))];

		peers = peers.map((peer) => ({
			active: false,
			peer,
			last_seen_at: null,
		}));

		if (peers.length) {
			FederationServers.model.rawCollection().insertMany(peers);
		}
	},
});

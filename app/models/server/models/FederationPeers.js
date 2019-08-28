import { Base } from './_Base';
import { Users } from '../raw';

class FederationPeersModel extends Base {
	constructor() {
		super('federation_peers');

		this.tryEnsureIndex({ active: 1, isRemote: 1 });
	}

	async refreshPeers(localIdentifier) {
		const peers = await Users.getDistinctFederationPeers();

		peers.forEach((peer) =>
			this.update({ peer }, {
				$setOnInsert: {
					isRemote: localIdentifier !== peer,
					active: false,
					peer,
					last_seen_at: null,
					last_failure_at: null,
				},
			}, { upsert: true })
		);

		this.remove({ peer: { $nin: peers } });
	}

	updateStatuses(seenPeers) {
		for (const peer of Object.keys(seenPeers)) {
			const seen = seenPeers[peer];

			const updateQuery = {};

			if (seen) {
				updateQuery.active = true;
				updateQuery.last_seen_at = new Date();
			} else {
				updateQuery.active = false;
				updateQuery.last_failure_at = new Date();
			}

			this.update({ peer }, { $set: updateQuery });
		}
	}

	findActiveRemote() {
		return this.find({ active: true, isRemote: true });
	}

	findNotActiveRemote() {
		return this.find({ active: false, isRemote: true });
	}

	findRemote() {
		return this.find({ isRemote: true });
	}
}

export const FederationPeers = new FederationPeersModel();

import { Meteor } from 'meteor/meteor';

import { Base } from './_Base';

import { Users } from '..';

class FederationPeersModel extends Base {
	constructor() {
		super('federation_peers');
	}

	refreshPeers() {
		const collectionObj = this.model.rawCollection();
		const findAndModify = Meteor.wrapAsync(collectionObj.findAndModify, collectionObj);

		const users = Users.find({ federation: { $exists: true } }, { fields: { federation: 1 } }).fetch();

		const peers = [...new Set(users.map((u) => u.federation.peer))];

		for (const peer of peers) {
			findAndModify({ peer }, [], {
				$setOnInsert: {
					active: false,
					peer,
					last_seen_at: null,
					last_failure_at: null,
				},
			}, { upsert: true });
		}

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
}

export const FederationPeers = new FederationPeersModel();

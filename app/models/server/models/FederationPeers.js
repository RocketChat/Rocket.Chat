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
				updateQuery.last_failure_notification_at = null;
			} else {
				updateQuery.active = false;
				updateQuery.last_failure_at = new Date();
			}

			this.update({ peer }, { $set: updateQuery });
		}
	}

	getActivePeers() {
		return this.find({ active: true }).fetch();
	}

	notifyInactivePeerRooms() {
		// Get inactive peers with no notifications
		const inactivePeers = this.find({
			active: false,
			last_failure_notification_at: null,
		}).fetch();

		// Set the notification date
		this.update({
			_id: { $in: inactivePeers.map((p) => p._id) },
		}, {
			$set: { last_failure_notification_at: new Date() },
		});

		// Still unclear what we are going to do here

		// // Notify all rooms
		// const rooms = Rooms.find({ 'federation.peers': inactivePeers.map((p) => p.peer) });
		//
		// for (const room of rooms) {
		// 	// Create system message
		// 	Messages.createPeerInactive(room._id, localUsername, {
		// 		u: {
		// 			_id: userId,
		// 			username: localUsername,
		// 		},
		// 		peer: domain,
		// 	});
		// }
	}
}

export const FederationPeers = new FederationPeersModel();

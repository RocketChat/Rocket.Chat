import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import { logger } from './logger';
import { ping } from './methods/ping';
import { FederationPeers, Rooms } from '../../models';


export class PeerPinger {
	constructor() {
		this.config = {
			pingInterval: 5000,
		};

		this.peers = [];
	}

	log(message) {
		logger.pinger.info(message);
	}

	start() {
		this.pingAllPeers();
	}

	pingAllPeers() {
		// Ping peers
		const lastSeenAt = moment().subtract(10, 'm').toDate();

		const peers = FederationPeers.find({ $or: [{ last_seen_at: null }, { last_seen_at: { $lte: lastSeenAt } }] }).fetch();

		const pingResults = ping(peers.map((p) => p.peer));

		FederationPeers.updateStatuses(pingResults);

		// Update rooms
		const outdatedPeers = FederationPeers.getPeersWithOutdatedFailureNotifications();

		for (const outdatedPeer of outdatedPeers) {
			const domain = outdatedPeer.peer;

			Rooms.update(
				{
					'federation.peers': domain,
					'federation.statuses': { $elemMatch: { domain } },
				},
				{ $set: { 'federation.statuses.$.status': outdatedPeer.status } }
			);

			// Rooms.update({ 'federation.peers': domain }, {
			// 	$set: {
			// 		[`federation.statuses.0.${ domain }`]: outdatedPeer.status,
			// 	},
			// });
		}

		Meteor.setTimeout(this.pingAllPeers.bind(this), this.config.pingInterval);
	}
}

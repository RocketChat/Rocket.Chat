import { Meteor } from 'meteor/meteor';
import { logger } from './logger';

import { FederationPeers } from '../../models';

import { ping } from './methods/ping';

import moment from 'moment';

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
		const lastSeenAt = moment().subtract(10, 'm').toDate();

		const peers = FederationPeers.find({ $or: [{ last_seen_at: null }, { last_seen_at: { $lte: lastSeenAt } }] }).fetch();

		const pingResults = ping(peers.map((p) => p.peer));

		FederationPeers.updateStatuses(pingResults);

		Meteor.setTimeout(this.pingAllPeers.bind(this), this.config.pingInterval);
	}
}

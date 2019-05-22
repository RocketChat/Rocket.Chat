import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import { FederationEvents, FederationPeers, Users } from '../../../models';

import { Federation } from '..';

export function federationGetOverviewData() {
	if (!Meteor.userId()) {
		throw new Meteor.Error('not-authorized');
	}

	const numberOfEvents = FederationEvents.find({ t: { $ne: 'png' } }).count();
	const numberOfFederatedUsers = Users.find({ federation: { $exists: true }, 'federation.peer': { $ne: Federation.localIdentifier } }).count();
	const numberOfActivePeers = FederationPeers.find({ active: true, peer: { $ne: Federation.localIdentifier } }).count();
	const numberOfInactivePeers = FederationPeers.find({ active: false, peer: { $ne: Federation.localIdentifier } }).count();

	return {
		data: [{
			title: 'Number_of_events',
			value: numberOfEvents,
		}, {
			title: 'Number_of_federated_users',
			value: numberOfFederatedUsers,
		}, {
			title: 'Number_of_active_peers',
			value: numberOfActivePeers,
		}, {
			title: 'Number_of_inactive_peers',
			value: numberOfInactivePeers,
		}],
	};
}

export function federationGetPeerStatuses() {
	if (!Meteor.userId()) {
		throw new Meteor.Error('not-authorized');
	}

	const peers = FederationPeers.find({ peer: { $ne: Federation.localIdentifier } }).fetch();

	const peerStatuses = [];

	const stabilityLimit = moment().subtract(5, 'days');

	for (const { peer, active, last_seen_at: lastSeenAt, last_failure_at: lastFailureAt } of peers) {
		let status = 'failing';

		if (active && lastFailureAt && moment(lastFailureAt).isAfter(stabilityLimit)) {
			status = 'unstable';
		} else if (active) {
			status = 'stable';
		}

		peerStatuses.push({
			peer,
			status,
			statusAt: active ? lastSeenAt : lastFailureAt,
		});
	}

	return {
		data: peerStatuses,
	};
}

Meteor.methods({
	'federation:getOverviewData': federationGetOverviewData,
	'federation:getPeerStatuses': federationGetPeerStatuses,
});

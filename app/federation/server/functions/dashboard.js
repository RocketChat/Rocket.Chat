import { Meteor } from 'meteor/meteor';

import { FederationServers, FederationRoomEvents, Users } from '../../../models/server';

export function getStatistics() {
	const numberOfEvents = FederationRoomEvents.find().count();
	const numberOfFederatedUsers = Users.findRemote().count();
	const numberOfServers = FederationServers.find().count();

	return { numberOfEvents, numberOfFederatedUsers, numberOfServers };
}

export function federationGetOverviewData() {
	if (!Meteor.userId()) {
		throw new Meteor.Error('not-authorized');
	}

	const { numberOfEvents, numberOfFederatedUsers, numberOfServers } = getStatistics();

	return {
		data: [{
			title: 'Number_of_events',
			value: numberOfEvents,
		}, {
			title: 'Number_of_federated_users',
			value: numberOfFederatedUsers,
		}, {
			title: 'Number_of_federated_servers',
			value: numberOfServers,
		}],
	};
}

export function federationGetServers() {
	if (!Meteor.userId()) {
		throw new Meteor.Error('not-authorized');
	}

	const servers = FederationServers.find().fetch();

	return {
		data: servers,
	};
}

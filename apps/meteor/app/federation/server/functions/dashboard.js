import { FederationServers, FederationRoomEvents, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

export async function getStatistics() {
	const numberOfEvents = await FederationRoomEvents.estimatedDocumentCount();
	const numberOfFederatedUsers = await Users.countRemote();
	const numberOfServers = await FederationServers.estimatedDocumentCount();

	return { numberOfEvents, numberOfFederatedUsers, numberOfServers };
}

export async function federationGetOverviewData() {
	if (!Meteor.userId()) {
		throw new Meteor.Error('not-authorized');
	}

	const { numberOfEvents, numberOfFederatedUsers, numberOfServers } = await getStatistics();

	return {
		data: [
			{
				title: 'Number_of_events',
				value: numberOfEvents,
			},
			{
				title: 'Number_of_federated_users',
				value: numberOfFederatedUsers,
			},
			{
				title: 'Number_of_federated_servers',
				value: numberOfServers,
			},
		],
	};
}

export async function federationGetServers() {
	if (!Meteor.userId()) {
		throw new Meteor.Error('not-authorized');
	}

	const servers = await FederationServers.find().toArray();

	return {
		data: servers,
	};
}

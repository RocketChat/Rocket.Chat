import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization/server';

export const mountIntegrationQueryBasedOnPermissions = async (userId) => {
	if (!userId) {
		throw new Meteor.Error('You must provide the userId to the "mountIntegrationQueryBasedOnPermissions" fucntion.');
	}
	const canViewAllOutgoingIntegrations = await hasPermission(userId, 'manage-outgoing-integrations');
	const canViewAllIncomingIntegrations = await hasPermission(userId, 'manage-incoming-integrations');
	const canViewOnlyOwnOutgoingIntegrations = await hasPermission(userId, 'manage-own-outgoing-integrations');
	const canViewOnlyOwnIncomingIntegrations = await hasPermission(userId, 'manage-own-incoming-integrations');

	const query = {};

	if (canViewAllOutgoingIntegrations && canViewAllIncomingIntegrations) {
		return query;
	}
	if (canViewOnlyOwnOutgoingIntegrations && canViewOnlyOwnIncomingIntegrations) {
		return { '_createdBy._id': userId };
	}
	query.$or = [];

	if (canViewAllOutgoingIntegrations) {
		query.$or.push({ type: 'webhook-outgoing' });
	}
	if (canViewAllIncomingIntegrations) {
		query.$or.push({ type: 'webhook-incoming' });
	}
	if (canViewOnlyOwnOutgoingIntegrations) {
		query.$or.push({ '_createdBy._id': userId, 'type': 'webhook-outgoing' });
	}
	if (canViewOnlyOwnIncomingIntegrations) {
		query.$or.push({ '_createdBy._id': userId, 'type': 'webhook-incoming' });
	}
	return query;
};

export const mountIntegrationHistoryQueryBasedOnPermissions = (userId, integrationId) => {
	if (!userId) {
		throw new Meteor.Error('You must provide the userId to the "mountIntegrationHistoryQueryBasedOnPermissions" fucntion.');
	}
	if (!integrationId) {
		throw new Meteor.Error('You must provide the integrationId to the "mountIntegrationHistoryQueryBasedOnPermissions" fucntion.');
	}

	const canViewOnlyOwnOutgoingIntegrations = hasPermission(userId, 'manage-own-outgoing-integrations');
	const canViewAllOutgoingIntegrations = hasPermission(userId, 'manage-outgoing-integrations');
	if (!canViewAllOutgoingIntegrations && canViewOnlyOwnOutgoingIntegrations) {
		return { 'integration._id': integrationId, 'integration._createdBy._id': userId };
	}
	return { 'integration._id': integrationId };
};

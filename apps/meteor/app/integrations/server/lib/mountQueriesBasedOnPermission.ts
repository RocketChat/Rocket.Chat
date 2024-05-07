import type { DeepWritable } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import type { Filter } from 'mongodb';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

export const mountIntegrationQueryBasedOnPermissions = async (userId: string) => {
	if (!userId) {
		throw new Meteor.Error('You must provide the userId to the "mountIntegrationQueryBasedOnPermissions" function.');
	}
	const canViewAllOutgoingIntegrations = await hasPermissionAsync(userId, 'manage-outgoing-integrations');
	const canViewAllIncomingIntegrations = await hasPermissionAsync(userId, 'manage-incoming-integrations');
	const canViewOnlyOwnOutgoingIntegrations = await hasPermissionAsync(userId, 'manage-own-outgoing-integrations');
	const canViewOnlyOwnIncomingIntegrations = await hasPermissionAsync(userId, 'manage-own-incoming-integrations');

	const query: DeepWritable<Filter<any>> = {};

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

export const mountIntegrationHistoryQueryBasedOnPermissions = async (userId: string, integrationId: string) => {
	if (!userId) {
		throw new Meteor.Error('You must provide the userId to the "mountIntegrationHistoryQueryBasedOnPermissions" fucntion.');
	}
	if (!integrationId) {
		throw new Meteor.Error('You must provide the integrationId to the "mountIntegrationHistoryQueryBasedOnPermissions" fucntion.');
	}

	const canViewOnlyOwnOutgoingIntegrations = await hasPermissionAsync(userId, 'manage-own-outgoing-integrations');
	const canViewAllOutgoingIntegrations = await hasPermissionAsync(userId, 'manage-outgoing-integrations');
	if (!canViewAllOutgoingIntegrations && canViewOnlyOwnOutgoingIntegrations) {
		return { 'integration._id': integrationId, 'integration._createdBy._id': userId };
	}
	return { 'integration._id': integrationId };
};

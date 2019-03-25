import { Meteor } from 'meteor/meteor';
import { hasPermission, hasAtLeastOnePermission } from '../../../authorization';
import { Integrations } from '../../../models';

const getQueryToFindIntegrations = (userId) => {
	const canViewAllOutgoingIntegrations = hasPermission(userId, 'manage-outgoing-integrations');
	const canViewAllIncomingIntegrations = hasPermission(userId, 'manage-incoming-integrations');
	const canViewOnlyOwnOutgoingIntegrations = hasPermission(userId, 'manage-own-outgoing-integrations');
	const canViewOnlyOwnIncomingIntegrations = hasPermission(userId, 'manage-own-incoming-integrations');

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
		query.$or.push({ '_createdBy._id': userId, type: 'webhook-outgoing' });
	}
	if (canViewOnlyOwnIncomingIntegrations) {
		query.$or.push({ '_createdBy._id': userId, type: 'webhook-incoming' });
	}
	return query;

};

Meteor.publish('integrations', function _integrationPublication() {
	if (!this.userId) {
		return this.ready();
	}

	if (!hasAtLeastOnePermission(this.userId, [
		'manage-outgoing-integrations',
		'manage-own-outgoing-integrations',
		'manage-incoming-integrations',
		'manage-own-incoming-integrations',
	])) {
		throw new Meteor.Error('not-authorized');
	}

	return Integrations.find(getQueryToFindIntegrations(this.userId));
});

import { Meteor } from 'meteor/meteor';
import { hasPermission, hasAtLeastOnePermission } from '../../../authorization';
import { IntegrationHistory } from '../../../models';

Meteor.publish('integrationHistory', function _integrationHistoryPublication(integrationId, limit = 25) {
	if (!this.userId) {
		return this.ready();
	}
	if(!hasAtLeastOnePermission(this.userId, [
		'manage-outgoing-integrations',
		'manage-own-outgoing-integrations',
	])) {
		throw new Meteor.Error('not-authorized');
	}

	const canViewAllOutgoingIntegrations = hasPermission(this.userId, 'manage-outgoing-integrations');
	const canViewOnlyOwnOutgoingIntegrations = hasPermission(this.userId, 'manage-own-outgoing-integrations');

	if (canViewAllOutgoingIntegrations) {
		return IntegrationHistory.findByIntegrationId(integrationId, { sort: { _updatedAt: -1 }, limit });
	}	
	if (canViewOnlyOwnOutgoingIntegrations) {
		return IntegrationHistory.findByIntegrationIdAndCreatedBy(integrationId, this.userId, { sort: { _updatedAt: -1 }, limit });
	}
});

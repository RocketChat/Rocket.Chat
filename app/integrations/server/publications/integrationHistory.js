import { Meteor } from 'meteor/meteor';
import { hasPermission } from '/app/authorization';
import { IntegrationHistory } from '/app/models';

Meteor.publish('integrationHistory', function _integrationHistoryPublication(integrationId, limit = 25) {
	if (!this.userId) {
		return this.ready();
	}

	if (hasPermission(this.userId, 'manage-integrations')) {
		return IntegrationHistory.findByIntegrationId(integrationId, { sort: { _updatedAt: -1 }, limit });
	} else if (hasPermission(this.userId, 'manage-own-integrations')) {
		return IntegrationHistory.findByIntegrationIdAndCreatedBy(integrationId, this.userId, { sort: { _updatedAt: -1 }, limit });
	} else {
		throw new Meteor.Error('not-authorized');
	}
});

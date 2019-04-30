import { Meteor } from 'meteor/meteor';
import { hasPermission } from '../../../authorization';
import { IntegrationHistory } from '../../../models';

Meteor.publish('integrationHistory', function _integrationHistoryPublication(integrationId, limit = 25) {
	if (!this.userId) {
		return this.ready();
	}

	if (hasPermission(this.userId, 'manage-integrations')) {
		return IntegrationHistory.findByIntegrationId(integrationId, { sort: { _updatedAt: -1 }, limit });
	} if (hasPermission(this.userId, 'manage-own-integrations')) {
		return IntegrationHistory.findByIntegrationIdAndCreatedBy(integrationId, this.userId, { sort: { _updatedAt: -1 }, limit });
	}
	throw new Meteor.Error('not-authorized');
});

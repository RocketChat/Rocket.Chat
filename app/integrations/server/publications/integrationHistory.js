import { Meteor } from 'meteor/meteor';

import { hasAtLeastOnePermission } from '../../../authorization/server';
import { IntegrationHistory } from '../../../models/server';
import { mountIntegrationHistoryQueryBasedOnPermissions } from '../lib/mountQueriesBasedOnPermission';

Meteor.publish('integrationHistory', function _integrationHistoryPublication(integrationId, limit = 25) {
	if (!this.userId) {
		return this.ready();
	}
	if (!hasAtLeastOnePermission(this.userId, [
		'manage-outgoing-integrations',
		'manage-own-outgoing-integrations',
	])) {
		throw new Meteor.Error('not-authorized');
	}

	return IntegrationHistory.find(Object.assign(mountIntegrationHistoryQueryBasedOnPermissions(this.userId, integrationId)), { sort: { _updatedAt: -1 }, limit });
});

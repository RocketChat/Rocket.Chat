import { Meteor } from 'meteor/meteor';
import { hasAtLeastOnePermission } from '../../../authorization';
import { Integrations } from '../../../models';
import { mountIntegrationQueryBasedOnPermissions } from '../lib/mountQueriesBasedOnPermission';

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

	return Integrations.find(mountIntegrationQueryBasedOnPermissions(this.userId));
});

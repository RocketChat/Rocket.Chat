import { Template } from 'meteor/templating';
import { hasAtLeastOnePermission } from '../../../authorization';

Template.integrationsNew.helpers({
	hasPermission() {
		return hasAtLeastOnePermission([
			'manage-outgoing-integrations',
			'manage-own-outgoing-integrations',
			'manage-incoming-integrations',
			'manage-own-incoming-integrations',
		]);
	},
	canAddIncomingIntegration() {
		return hasAtLeastOnePermission([
			'manage-incoming-integrations',
			'manage-own-incoming-integrations',
		]);
	},
	canAddOutgoingIntegration() {
		return hasAtLeastOnePermission([
			'manage-outgoing-integrations',
			'manage-own-outgoing-integrations',
		]);
	},
});

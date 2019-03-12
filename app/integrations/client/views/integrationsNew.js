import { Template } from 'meteor/templating';
import { hasAtLeastOnePermission } from '/app/authorization';

Template.integrationsNew.helpers({
	hasPermission() {
		return hasAtLeastOnePermission(['manage-integrations', 'manage-own-integrations']);
	},
});

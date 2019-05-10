import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';

import { hasAtLeastOnePermission } from '../../../authorization';
import { SideNav } from '../../../ui-utils/client';

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

Template.integrationsNew.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});

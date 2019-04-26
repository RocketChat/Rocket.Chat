import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { hasAtLeastOnePermission } from '../../../authorization';
import { SideNav } from '../../../ui-utils/client';

Template.integrationsNew.helpers({
	hasPermission() {
		return hasAtLeastOnePermission(['manage-integrations', 'manage-own-integrations']);
	},
});

Template.integrationsNew.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});

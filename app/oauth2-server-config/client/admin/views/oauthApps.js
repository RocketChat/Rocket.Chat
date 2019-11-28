import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import moment from 'moment';

import { hasAllPermission } from '../../../../authorization';
import { SideNav } from '../../../../ui-utils/client';
import { APIClient } from '../../../../utils/client';

Template.oauthApps.onCreated(async function() {
	this.oauthApps = new ReactiveVar([]);
	const { oauthApps } = await APIClient.v1.get('oauthApps.list');
	this.oauthApps.set(oauthApps);
});

Template.oauthApps.helpers({
	hasPermission() {
		return hasAllPermission('manage-oauth-apps');
	},
	applications() {
		return Template.instance().oauthApps.get();
	},
	dateFormated(date) {
		return moment(date).format('L LT');
	},
});

Template.oauthApps.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});

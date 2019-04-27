import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { hasAllPermission } from '../../../../authorization';
import { ChatOAuthApps } from '../collection';
import moment from 'moment';
import { SideNav } from '../../../../ui-utils/client';

Template.oauthApps.onCreated(function() {
	this.subscribe('oauthApps');
});

Template.oauthApps.helpers({
	hasPermission() {
		return hasAllPermission('manage-oauth-apps');
	},
	applications() {
		return ChatOAuthApps.find();
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


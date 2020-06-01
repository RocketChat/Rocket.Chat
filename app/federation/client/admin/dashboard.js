import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { hasRole } from '../../../authorization';
import { registerAdminRoute, registerAdminSidebarItem } from '../../../../client/admin';

import './dashboard.html';
import './dashboard.css';

// Template controller
let templateInstance;		// current template instance/context

// Methods
const updateOverviewData = () => {
	Meteor.call('federation:getOverviewData', (error, result) => {
		if (error) {
			return;
		}

		const { data } = result;

		templateInstance.federationOverviewData.set(data);
	});
};

const updateServers = () => {
	Meteor.call('federation:getServers', (error, result) => {
		if (error) {
			return;
		}

		const { data } = result;

		templateInstance.federationPeers.set(data);
	});
};

const updateData = () => {
	updateOverviewData();
	updateServers();
};

Template.dashboard.helpers({
	federationOverviewData() {
		return templateInstance.federationOverviewData.get();
	},
	federationPeers() {
		return templateInstance.federationPeers.get();
	},
});

// Events
Template.dashboard.onCreated(function() {
	templateInstance = Template.instance();

	this.federationOverviewData = new ReactiveVar();
	this.federationPeers = new ReactiveVar();
});

Template.dashboard.onRendered(() => {
	Tracker.autorun(updateData);

	setInterval(updateData, 10000);
});

// Route setup

registerAdminRoute('/federation-dashboard', {
	name: 'federation-dashboard',
	action() {
		BlazeLayout.render('main', { center: 'dashboard', old: true });
	},
});

registerAdminSidebarItem({
	icon: 'discover',
	href: 'federation-dashboard',
	i18nLabel: 'Federation Dashboard',
	permissionGranted() {
		return hasRole(Meteor.userId(), 'admin');
	},
});

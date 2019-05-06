import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { AdminBox } from '../../../ui-utils';
import { hasRole } from '../../../authorization';

import './dashboard.html';
import './dashboard.css';

// Template controller
let templateInstance;		// current template instance/context

// Methods
const updateOverviewData = () => {
	Meteor.call('federation:getOverviewData', (error, result) => {
		if (error) {
			console.log(error);

			return;
			// return handleError(error);
		}

		const { data } = result;

		templateInstance.federationOverviewData.set(data);
	});
};

const updatePeerStatuses = () => {
	Meteor.call('federation:getPeerStatuses', (error, result) => {
		if (error) {
			console.log(error);

			return;
			// return handleError(error);
		}

		const { data } = result;

		templateInstance.federationPeerStatuses.set(data);
	});
};

const updateData = () => {
	updateOverviewData();
	updatePeerStatuses();
};

Template.dashboard.helpers({
	federationOverviewData() {
		return templateInstance.federationOverviewData.get();
	},
	federationPeerStatuses() {
		return templateInstance.federationPeerStatuses.get();
	},
});

// Events
Template.dashboard.onCreated(function() {
	templateInstance = Template.instance();

	this.federationOverviewData = new ReactiveVar();
	this.federationPeerStatuses = new ReactiveVar();
});

Template.dashboard.onRendered(() => {
	Tracker.autorun(updateData);

	setInterval(updateData, 10000);
});

// Route setup

FlowRouter.route('/admin/federation-dashboard', {
	name: 'federation-dashboard',
	action() {
		BlazeLayout.render('main', { center: 'dashboard', old: true });
	},
});

AdminBox.addOption({
	icon: 'discover',
	href: 'admin/federation-dashboard',
	i18nLabel: 'Federation Dashboard',
	permissionGranted() {
		return hasRole(Meteor.userId(), 'admin');
	},
});

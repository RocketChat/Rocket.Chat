import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { FlowRouter } from 'meteor/kadira:flow-router';
import vis from 'vis';
import moment from 'moment';

import { AdminBox } from '../../../ui-utils';
import { hasRole } from '../../../authorization';

import './dashboard.html';
import './dashboard.css';

// Template controller
let templateInstance;		// current template instance/context

// Vis datasets
const visDataSets = {
	nodes: new vis.DataSet(),
	edges: new vis.DataSet(),
};


let latestEventTimestamp = moment().startOf('week');

// Methods
const loadContextEvents = () => {
	Meteor.call('federation:loadContextEvents', latestEventTimestamp.toISOString(), (error, result) => {
		if (error) {
			console.log(error);

			return;
		}

		for (const event of result) {
			let label = '';

			switch (event.type) {
				case 'genesis':
					label = `[${ event.origin }] Genesis`;
					break;
				case 'room_add_user':
					label = `[${ event.origin }] Added user => ${ event.data.user.username }`;
					break;
				case 'room_message':
					label = `[${ event.origin }] New message => ${ event.data.message.msg.substring(0, 10) }`;
					break;
			}

			visDataSets.nodes.add({
				id: event._id,
				label,
			});

			for (const previous_id of event.parentIds) {
				visDataSets.edges.add({
					id: `${ event._id }${ previous_id }`,
					from: previous_id,
					to: event._id,
				});
			}

			if (latestEventTimestamp === null || event.timestamp > latestEventTimestamp) {
				latestEventTimestamp = event.timestamp;
			}
		}
	});
};

const updateData = () => {
	// updateOverviewData();
	// updatePeerStatuses();

	loadContextEvents();
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

	// Setup vis.js
	new vis.Network(templateInstance.find('#network'), visDataSets, {
		layout: {
			hierarchical: {
				direction: 'UD',
				sortMethod: 'directed',
			},
		},
		interaction: { dragNodes: false },
		physics: {
			enabled: false,
		},
		configure: {
			filter(option, path) {
				if (path.indexOf('hierarchical') !== -1) {
					return true;
				}
				return false;
			},
			showButton: false,
		},
	});

	setInterval(updateData, 5000);
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

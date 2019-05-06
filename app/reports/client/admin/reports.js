import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { AdminBox, RocketChatTabBar, SideNav, TabBar } from '../../../ui-utils';

import { hasRole } from '../../../authorization';
import { Reports } from '../../../models/client/models/Reports';

import './reports.html';
import './reportInfo.html';
import './reports.css';

// Template controller
let templateInstance;		// current template instance/context

Template.reports.helpers({
	reportsList() {
		return Reports.find();
	},
	flexData() {
		return {
			tabBar: Template.instance().tabBar,
			data: Template.instance().tabBarData.get(),
		};
	},
	onTableItemClick() {
		const instance = Template.instance();
		return function(item) {
			instance.tabBarData.set(Reports.findOne({ _id: item._id }));
			instance.tabBar.showGroup('reports-selected');
			instance.tabBar.open('admin-report-info');
		};
	},
});

// Events
Template.reports.onCreated(function() {
	templateInstance = Template.instance();

	this.tabBar = new RocketChatTabBar();
	this.tabBar.showGroup('reports-selected');
	this.tabBarData = new ReactiveVar();

	TabBar.addButton({
		groups: ['reports-selected'],
		id: 'admin-report-info',
		i18nTitle: 'Report Info',
		icon: 'report',
		openClick(/* e, t*/) {
			templateInstance.tabBarData.set();
			return true;
		},
		template: 'reportInfo',
		order: 1,
	});

	this.autorun(function() {
		templateInstance.subscribe('reports');
		// templateInstance.ready.set(subscription.ready());
	});
});

Template.reports.onRendered(() => {
	Tracker.afterFlush(function() {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});

// Route setup

FlowRouter.route('/admin/reports', {
	name: 'reports',
	action() {
		BlazeLayout.render('main', { center: 'reports', old: true });
	},
});

AdminBox.addOption({
	icon: 'report',
	href: 'admin/reports',
	i18nLabel: 'Reports',
	permissionGranted() {
		return hasRole(Meteor.userId(), 'admin');
	},
});

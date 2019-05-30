import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';

import { t } from '../../../utils/client';
import { handleError } from '../../../utils/client/lib/handleError';
import { SideNav } from '../../../ui-utils';
import { modal } from '../../../ui-utils/client/lib/modal';
import { hasAllPermission } from '../../../authorization/client/hasPermission';
import FullUser from '../../../models/client/models/FullUser';
import './serviceAccountDashboard.html';

Template.serviceAccountDashboard.helpers({
	isReady() {
		const instance = Template.instance();
		return instance.ready && instance.ready.get();
	},
	users() {
		return Template.instance().users();
	},
	hasPermission() {
		return hasAllPermission('view-service-account-request');
	},
	hasUsers() {
		return Template.instance().users() && Template.instance().users().count() > 0;
	},
	emailAddress() {
		return _.map(this.emails, function(e) { return e.address; }).join(', ');
	},
	hasMore() {
		const instance = Template.instance();
		const users = instance.users();
		if (instance.limit && instance.limit.get() && users && users.length) {
			return instance.limit.get() === users.length;
		}
	},
});

Template.serviceAccountDashboard.events({
	'click .user-info'(e) {
		e.preventDefault();
		modal.open({
			title: t('Are_you_sure'),
			text: t('The_user_s_will_be_allowed_to_create_service_accounts', this.username),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false,
		}, () => {
			Meteor.call('authorization:removeUserFromRole', 'service-account-applied', this.username, null, function(error) {
				if (error) {
					return handleError(error);
				}
			});
			Meteor.call('authorization:addUserToRole', 'service-account-approved', this.username, null, function(error) {
				if (error) {
					return handleError(error);
				}

				modal.open({
					title: t('Added'),
					text: t('User_added'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false,
				});
			});
		});
	},
});

Template.serviceAccountDashboard.onCreated(function() {
	const instance = this;
	this.limit = new ReactiveVar(50);
	this.ready = new ReactiveVar(true);
	this.filter = new ReactiveVar('');

	this.autorun(() => {
		const filter = instance.filter.get();
		const limit = instance.limit.get();
		const subscription = instance.subscribe('fullUserData', filter, limit);
		instance.ready.set(subscription.ready());
	});
	this.users = function() {
		const roles = [].concat('service-account-applied');
		const query = {
			roles: { $in: roles },
		};
		const limit = instance.limit && instance.limit.get();
		return FullUser.find(query, { limit, sort: { username: 1, name: 1 } }).fetch();
	};
});

Template.serviceAccountDashboard.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});

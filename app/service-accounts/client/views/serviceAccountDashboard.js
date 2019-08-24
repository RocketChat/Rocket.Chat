import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import toastr from 'toastr';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';

import { t } from '../../../utils/client';
import { handleError } from '../../../utils/client/lib/handleError';
import { SideNav } from '../../../ui-utils';
import { hasAllPermission } from '../../../authorization/client/hasPermission';
import FullUser from '../../../models/client/models/FullUser';
import './serviceAccountDashboard.html';

const success = (fn) => function(error, result) {
	if (error) {
		return handleError(error);
	}
	if (result) {
		fn.call(this, result);
	}
};

Template.serviceAccountDashboard.helpers({
	isReady() {
		const instance = Template.instance();
		return instance.ready && instance.ready.get();
	},
	users() {
		return Template.instance().users();
	},
	hasPermission() {
		return hasAllPermission('view-sa-request');
	},
	hasUsers() {
		return Template.instance().users() && Template.instance().users().length > 0;
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
	'click .accept-service-account'(e) {
		e.preventDefault();
		Meteor.call('setUserActiveStatus', this._id, true, success(() => toastr.success(t('User_has_been_activated'))));
	},
	'click .reject-service-account'(e) {
		e.preventDefault();
		Meteor.call('deleteUser', this._id, success(() => {
			toastr.success(t('User_has_been_deleted'));
		}));
	},
});

Template.serviceAccountDashboard.onCreated(function() {
	const instance = this;
	this.ready = new ReactiveVar(true);

	this.autorun(() => {
		const subscription = instance.subscribe('fullServiceAccountData');
		instance.ready.set(subscription.ready());
	});
	this.users = function() {
		const query = {
			u: {
				$exists: true,
			},
			active: false,
		};
		return FullUser.find(query, { sort: { username: 1, name: 1 } }).fetch();
	};
});

Template.serviceAccountDashboard.onRendered(() => {
	Tracker.afterFlush(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	});
});

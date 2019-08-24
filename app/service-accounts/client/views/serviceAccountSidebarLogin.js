import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { handleError } from '../../../utils';
import { callbacks } from '../../../callbacks';
import FullUser from '../../../models/client/models/FullUser';
import './serviceAccountSidebarLogin.html';
import { popover } from '../../../ui-utils/client';

Template.serviceAccountSidebarLogin.helpers({
	isReady() {
		const instance = Template.instance();
		return instance.ready && instance.ready.get();
	},
	users() {
		return Template.instance().users();
	},
	hasServiceAccounts() {
		return Template.instance().users() && Template.instance().users().length > 0;
	},
	owner() {
		return Meteor.user() && Meteor.user().u;
	},
	showOwnerAccountLink() {
		return localStorage.getItem('serviceAccountForceLogin') && Meteor.user() && !!Meteor.user().u;
	},
});

Template.serviceAccountSidebarLogin.events({
	'click .js-login'(e) {
		e.preventDefault();
		let { username } = this;
		if (Meteor.user() && Meteor.user().u) {
			username = Meteor.user().u.username;
		}
		Meteor.call('getLoginToken', username, function(error, token) {
			if (error) {
				return handleError(error);
			}
			if (Meteor.user() && !Meteor.user().u) {
				localStorage.setItem('serviceAccountForceLogin', true);
			} else {
				localStorage.removeItem('serviceAccountForceLogin');
			}
			const user = Meteor.user();
			Meteor.logout(() => {
				callbacks.run('afterLogoutCleanUp', user);
				Meteor.call('logoutCleanUp', user, document.cookie);
				FlowRouter.go('home');
				popover.close();
				Meteor.loginWithToken(token.token, (err) => {
					if (err) {
						return handleError(err);
					}
				});
			});
		});
	},
});

Template.serviceAccountSidebarLogin.onCreated(function() {
	const instance = this;
	this.ready = new ReactiveVar(true);
	this.autorun(() => {
		const subscription = instance.subscribe('userServiceAccounts');
		instance.ready.set(subscription.ready());
	});
	this.users = function() {
		const query = {
			'u._id': Meteor.userId(),
			active: true,
		};
		const limit = instance.limit && instance.limit.get();
		return FullUser.find(query, { limit, sort: { username: 1, name: 1 } }).fetch();
	};
});

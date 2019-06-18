import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { handleError } from '../../../utils';
import FullUser from '../../../models/client/models/FullUser';
import './serviceAccountSidebarLogin.html';

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
		return Meteor.user().u;
	},
	showOwnerAccountLink() {
		return localStorage.getItem('serviceAccountForceLogin') && !!Meteor.user().u;
	},
});

Template.serviceAccountSidebarLogin.events({
	'click .js-login'(e) {
		e.preventDefault();
		let { username } = this;
		if (Meteor.user().u) {
			username = Meteor.user().u.username;
		}
		console.log(username);
		Meteor.call('getLoginToken', username, function(error, token) {
			if (error) {
				return handleError(error);
			}
			FlowRouter.go('/home');
			Meteor.loginWithToken(token.token, (err) => {
				if (err) {
					console.log(err);
				}
				document.location.reload(true);
				if (Meteor.user().u) {
					localStorage.setItem('serviceAccountForceLogin', true);
				} else {
					localStorage.removeItem('serviceAccountForceLogin');
				}
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

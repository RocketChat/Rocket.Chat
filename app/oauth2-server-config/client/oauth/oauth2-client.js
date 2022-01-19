import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';
import { ReactiveVar } from 'meteor/reactive-var';

import { APIClient } from '../../../utils/client';

Template.authorize.onCreated(async function () {
	this.oauthApp = new ReactiveVar({});
	const { oauthApp } = await APIClient.v1.get(`oauth-apps.get?clientId=${this.data.client_id()}`);
	this.oauthApp.set(oauthApp);
});

Template.authorize.helpers({
	getToken() {
		return Meteor._localStorage.getItem(Accounts.LOGIN_TOKEN_KEY);
	},
	getClient() {
		return Template.instance().oauthApp.get();
	},
});

Template.authorize.events({
	'click #logout-oauth'() {
		return Meteor.logout();
	},
	'click #cancel-oauth'() {
		return window.close();
	},
});

Template.authorize.onRendered(function () {
	const user = Meteor.user();
	if (user && user.oauth && user.oauth.authorizedClients && user.oauth.authorizedClients.includes(this.data.client_id())) {
		$('button[type=submit]').click();
	}
});

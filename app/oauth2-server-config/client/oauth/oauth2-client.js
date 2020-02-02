import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';
import { ReactiveVar } from 'meteor/reactive-var';

import { APIClient } from '../../../utils/client';

FlowRouter.route('/oauth/authorize', {
	action(params, queryParams) {
		BlazeLayout.render('main', {
			center: 'authorize',
			modal: true,
			client_id: queryParams.client_id,
			redirect_uri: queryParams.redirect_uri,
			response_type: queryParams.response_type,
			state: queryParams.state,
		});
	},
});

FlowRouter.route('/oauth/error/:error', {
	action(params) {
		BlazeLayout.render('main', {
			center: 'oauth404',
			modal: true,
			error: params.error,
		});
	},
});

Template.authorize.onCreated(async function() {
	this.oauthApp = new ReactiveVar({});
	const { oauthApp } = await APIClient.v1.get(`oauth-apps.get?clientId=${ this.data.client_id() }`);
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

Template.authorize.onRendered(function() {
	const user = Meteor.user();
	if (user && user.oauth && user.oauth.authorizedClients && user.oauth.authorizedClients.includes(this.data.client_id())) {
		$('button[type=submit]').click();
	}
});

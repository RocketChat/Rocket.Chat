import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';
import { ReactiveVar } from 'meteor/reactive-var';
import type { IUser } from '@rocket.chat/core-typings';

import { APIClient } from '../../../utils/client';

Template.authorize.onCreated(async function () {
	this.oauthApp = new ReactiveVar(undefined);
	const { oauthApp } = await APIClient.get(`/v1/oauth-apps.get`, { clientId: this.data.client_id() });
	this.oauthApp.set({
		...oauthApp,
		_createdAt: new Date(oauthApp._createdAt),
		_updatedAt: new Date(oauthApp._updatedAt),
	});
});

Template.authorize.helpers({
	getToken() {
		return Meteor._localStorage.getItem(Accounts.LOGIN_TOKEN_KEY);
	},
	getClient() {
		return Template.instance<'authorize'>().oauthApp.get();
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
	const user = Meteor.user() as IUser | null;
	if (user?.oauth?.authorizedClients?.includes(this.data.client_id())) {
		$('button[type=submit]').click();
	}
});

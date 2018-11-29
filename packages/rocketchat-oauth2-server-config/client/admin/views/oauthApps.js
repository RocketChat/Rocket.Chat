import { Template } from 'meteor/templating';
import { RocketChat } from 'meteor/rocketchat:lib';
import { ChatOAuthApps } from '../collection';
import moment from 'moment';

Template.oauthApps.onCreated(function() {
	this.subscribe('oauthApps');
});

Template.oauthApps.helpers({
	hasPermission() {
		return RocketChat.authz.hasAllPermission('manage-oauth-apps');
	},
	applications() {
		return ChatOAuthApps.find();
	},
	dateFormated(date) {
		return moment(date).format('L LT');
	},
});

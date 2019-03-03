import { Template } from 'meteor/templating';
import { hasAllPermission } from 'meteor/rocketchat:authorization';
import { ChatOAuthApps } from '../collection';
import moment from 'moment';

Template.oauthApps.onCreated(function() {
	this.subscribe('oauthApps');
});

Template.oauthApps.helpers({
	hasPermission() {
		return hasAllPermission('manage-oauth-apps');
	},
	applications() {
		return ChatOAuthApps.find();
	},
	dateFormated(date) {
		return moment(date).format('L LT');
	},
});

/* globals ChatOAuthApps */
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
	}
});

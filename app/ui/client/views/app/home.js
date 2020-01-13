import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { settings } from '../../../../settings';

Template.home.helpers({
	title() {
		return settings.get('Layout_Home_Title');
	},
	body() {
		return settings.get('Layout_Home_Body');
	},
	isAnonymousReadAllowed() {
		return (Meteor.userId() == null)
			&& settings.get('Accounts_AllowAnonymousRead') === true;
	},
});

Template.home.events({
	'click .js-register'(event) {
		event.stopPropagation();
		event.preventDefault();

		Session.set('forceLogin', true);
	},
});

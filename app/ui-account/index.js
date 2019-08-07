import s from 'underscore.string';
// import { Meteor } from 'meteor/meteor';
// import { Accounts } from 'meteor/accounts-base';
// import { Tracker } from 'meteor/tracker';
// import { Blaze } from 'meteor/blaze';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import './client/avatar/avatar';
import { SideNav } from '../ui-utils';

FlowRouter.route('/account/:group?', {
	name: 'account',

	async action(params) {
		await import('./client');
		SideNav.setFlex('accountFlex');
		SideNav.openFlex();
		if (!params.group) {
			params.group = 'Preferences';
		}
		params.group = s.capitalize(params.group, true);
		BlazeLayout.render('main', { center: `account${ params.group }` });
	},
	triggersExit: [
		function() {
			$('.main-content').addClass('rc-old');
		},
	],
});

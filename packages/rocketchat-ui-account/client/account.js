import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';

Template.account.onRendered(function() {
	Tracker.afterFlush(function() {
		SideNav.setFlex('accountFlex');
		SideNav.openFlex();
	});
});

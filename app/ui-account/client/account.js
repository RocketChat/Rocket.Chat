import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import { SideNav } from '../../ui-utils';

Template.account.onRendered(function() {
	Tracker.afterFlush(function() {
		SideNav.setFlex('accountFlex');
		SideNav.openFlex();
	});
});

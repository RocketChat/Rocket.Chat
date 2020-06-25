import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';

import { SideNav } from '../../ui-utils';
import { createAccountSidebarTemplate } from '../../../client/account/sidebarItems';

createAccountSidebarTemplate();

Template.account.onRendered(function() {
	Tracker.afterFlush(function() {
		SideNav.setFlex('accountFlex');
		SideNav.openFlex();
	});
});

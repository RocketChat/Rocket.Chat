import { Template } from 'meteor/templating';

import { SideNav, Layout } from '../../../../ui-utils';
import { t } from '../../../../utils';
import './livechatFlex.html';
import { sidebarItems } from './livechatSideNavItems';

Template.livechatFlex.helpers({
	menuItem(name, icon, section) {
		return {
			name: t(name),
			icon,
			pathSection: section,
			darken: true,
		};
	},
	embeddedVersion() {
		return Layout.isEmbedded();
	},
	sidebarItems() {
		return sidebarItems.get();
	},
});

Template.livechatFlex.events({
	'click [data-action="close"]'() {
		SideNav.closeFlex();
	},
});

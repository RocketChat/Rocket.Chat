import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { SideNav, Layout } from '../../../../ui-utils';
import { t } from '../../../../utils';
import { hasPermission } from '../../../../authorization';
import './livechatFlex.html';
import { sidebarItems } from './livechatSideNavItems';

Template.livechatFlex.helpers({
	menuItem(name, icon, section) {
		const routeName = FlowRouter.getRouteName();
		return {
			name: t(name),
			icon,
			pathSection: section,
			darken: true,
			active: section === routeName,
		};
	},
	embeddedVersion() {
		return Layout.isEmbedded();
	},
	sidebarItems() {
		const items = sidebarItems.get();
		return items.filter((item) => !item.permission || hasPermission(item.permission));
	},
});

Template.livechatFlex.events({
	'click [data-action="close"]'() {
		SideNav.closeFlex();
	},
});

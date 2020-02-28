import { Template } from 'meteor/templating';

import { SideNav, Layout } from '../../../../ui-utils';
import { t } from '../../../../utils';
import { hasPermission } from '../../../../authorization';
import './omnichannelFlex.html';
import { sidebarItems } from './omnichannelSideNavItems';

Template.omnichannelFlex.helpers({
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
		const items = sidebarItems.get();
		return items.filter((item) => !item.permission || hasPermission(item.permission));
	},
});

Template.omnichannelFlex.events({
	'click [data-action="close"]'() {
		SideNav.closeFlex();
	},
});

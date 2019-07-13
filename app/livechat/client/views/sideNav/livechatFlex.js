import { Template } from 'meteor/templating';

import { SideNav, Layout } from '../../../../ui-utils';
import { t } from '../../../../utils';
import { hasPermission } from '../../../../authorization';
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
		const items = sidebarItems.get();
		const newItems = [];
		for (let item of items) {
			if (item.permission) {
				if (!hasPermission(item.permission)) {
					continue;
				}
			}

			newItems.push({
				title: item.title,
				slug: item.slug
			});
		}

		return newItems;
	},
});

Template.livechatFlex.events({
	'click [data-action="close"]'() {
		SideNav.closeFlex();
	},
});

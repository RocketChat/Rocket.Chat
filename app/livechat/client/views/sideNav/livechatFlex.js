import { Template } from 'meteor/templating';

import { SideNav, Layout } from '../../../../ui-utils';
import { t } from '../../../../utils';
import { hasAtLeastOnePermission } from '../../../../authorization';
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
		for (const item of items) {
			if (item.permission) {
				if (!hasAtLeastOnePermission(item.permission)) {
					continue;
				}
			}

			newItems.push({
				title: item.title,
				slug: item.slug,
			});
		}

		return sidebarItems.get();
	},
});

Template.livechatFlex.events({
	'click [data-action="close"]'() {
		SideNav.closeFlex();
	},
});

import { Template } from 'meteor/templating';
import { SideNav, Layout } from '/app/ui-utils';
import { t } from '/app/utils';

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
});

Template.livechatFlex.events({
	'click [data-action="close"]'() {
		SideNav.closeFlex();
	},
});

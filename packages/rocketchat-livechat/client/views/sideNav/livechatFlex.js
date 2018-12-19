import { Template } from 'meteor/templating';
import { RocketChat } from 'meteor/rocketchat:lib';
import { t, SideNav } from 'meteor/rocketchat:ui';

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
		return RocketChat.Layout.isEmbedded();
	},
});

Template.livechatFlex.events({
	'click [data-action="close"]'() {
		SideNav.closeFlex();
	},
});

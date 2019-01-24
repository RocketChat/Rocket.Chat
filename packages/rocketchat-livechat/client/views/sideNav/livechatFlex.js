import { Template } from 'meteor/templating';
import { RocketChat } from 'meteor/rocketchat:lib';
import { SideNav } from 'meteor/rocketchat:ui';
import { t } from 'meteor/rocketchat:utils';

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

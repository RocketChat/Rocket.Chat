import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { menu, SideNav, AdminBox, Layout } from '../../ui-utils/client';
import { t } from '../../utils';

Template.adminFlex.onCreated(function() {
	this.isEmbedded = Layout.isEmbedded();
});

const label = function() {
	return TAPi18n.__(this.i18nLabel || this._id);
};

Template.adminFlex.helpers({
	label,
	adminBoxOptions() {
		return AdminBox.getOptions();
	},
	menuItem(name, icon, section, group) {
		return {
			name: t(name),
			icon,
			pathSection: section,
			pathGroup: group,
			darken: true,
			isLightSidebar: true,
		};
	},
	embeddedVersion() {
		return this.isEmbedded;
	},
});

Template.adminFlex.events({
	'click [data-action="close"]'(e, instance) {
		if (instance.isEmbedded) {
			menu.close();
			return;
		}

		SideNav.closeFlex();
	},
});

import { Template } from 'meteor/templating';
import { RocketChat } from 'meteor/rocketchat:lib';
import { SideNav } from 'meteor/rocketchat:ui';
import { t } from 'meteor/rocketchat:utils';

Template.accountFlex.events({
	'click [data-action="close"]'() {
		SideNav.closeFlex();
		const sidebarElements = document.getElementsByClassName('sidebar-item');
		for (let i = 0; i < sidebarElements.length; i++) {
			const nonSelectedElement = sidebarElements[i].getElementsByTagName('a')[0];
			if (!sidebarElements[i].hasAttribute('data-id')) {
				if (nonSelectedElement.getAttribute('aria-label') !== 'Preferences') {
					sidebarElements[i].classList.remove('selected-bg-shade');
				} else {
					sidebarElements[i].classList.add('selected-bg-shade');
				}
			}
		}
	},
});

Template.accountFlex.helpers({
	allowUserProfileChange() {
		return RocketChat.settings.get('Accounts_AllowUserProfileChange');
	},
	accessTokensEnabled() {
		return RocketChat.authz.hasAllPermission(['create-personal-access-tokens']);
	},
	encryptionEnabled() {
		return RocketChat.settings.get('E2E_Enable');
	},
	webdavIntegrationEnabled() {
		return RocketChat.settings.get('Webdav_Integration_Enabled');
	},
	menuItem(name, icon, section, group) {
		return {
			name: t(name),
			icon,
			pathSection: section,
			pathGroup: group,
			darken: true,
		};
	},
	embeddedVersion() {
		return RocketChat.Layout.isEmbedded();
	},
});

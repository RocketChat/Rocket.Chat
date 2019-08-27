import { Template } from 'meteor/templating';

import { settings } from '../../settings';
import { hasAllPermission } from '../../authorization';
import { SideNav, Layout } from '../../ui-utils';
import { t } from '../../utils';

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
		return settings.get('Accounts_AllowUserProfileChange');
	},
	accessTokensEnabled() {
		return hasAllPermission(['create-personal-access-tokens']);
	},
	encryptionEnabled() {
		return settings.get('E2E_Enable');
	},
	webdavIntegrationEnabled() {
		return settings.get('Webdav_Integration_Enabled');
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
		return Layout.isEmbedded();
	},
});

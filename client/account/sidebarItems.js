import { HTML } from 'meteor/htmljs';

import { hasPermission } from '../../app/authorization/client';
import { createTemplateForComponent } from '../reactAdapters';
import { settings } from '../../app/settings';
import { createSidebarItems } from '../helpers/createSidebarItems';

createTemplateForComponent('accountFlex', () => import('./AccountSidebar'), {
	renderContainerView: () => HTML.DIV({ style: 'height: 100%; position: relative;' }), // eslint-disable-line new-cap
});

export const {
	registerSidebarItem: registerAccountSidebarItem,
	unregisterSidebarItem,
	itemsSubscription,
} = createSidebarItems([
	{
		pathSection: 'account',
		pathGroup: 'preferences',
		i18nLabel: 'Preferences',
		icon: 'customize',
	}, {
		pathSection: 'account',
		pathGroup: 'profile',
		i18nLabel: 'Profile',
		icon: 'user',
		permissionGranted: () => settings.get('Accounts_AllowUserProfileChange'),
	}, {
		pathSection: 'account',
		pathGroup: 'security',
		i18nLabel: 'Security',
		icon: 'lock',
		permissionGranted: () => settings.get('Accounts_TwoFactorAuthentication_Enabled') || settings.get('E2E_Enable'),
	}, {
		pathSection: 'account',
		pathGroup: 'integrations',
		i18nLabel: 'Integrations',
		icon: 'code',
		permissionGranted: () => settings.get('Webdav_Integration_Enabled'),
	}, {
		pathSection: 'account',
		pathGroup: 'tokens',
		i18nLabel: 'Personal_Access_Tokens',
		icon: 'key',
		permissionGranted: () => hasPermission('create-personal-access-tokens'),
	},
]);

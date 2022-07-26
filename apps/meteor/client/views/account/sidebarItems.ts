import { hasPermission } from '../../../app/authorization/client';
import { settings } from '../../../app/settings/client';
import { createSidebarItems } from '../../lib/createSidebarItems';

export const {
	registerSidebarItem: registerAccountSidebarItem,
	unregisterSidebarItem,
	getSidebarItems: getAccountSidebarItems,
	subscribeToSidebarItems: subscribeToAccountSidebarItems,
} = createSidebarItems([
	{
		href: 'preferences',
		i18nLabel: 'Preferences',
		icon: 'customize',
	},
	{
		href: 'profile',
		i18nLabel: 'Profile',
		icon: 'user',
		permissionGranted: (): boolean => settings.get('Accounts_AllowUserProfileChange'),
	},
	{
		href: 'security',
		i18nLabel: 'Security',
		icon: 'lock',
		permissionGranted: (): boolean => settings.get('Accounts_TwoFactorAuthentication_Enabled') || settings.get('E2E_Enable'),
	},
	{
		href: 'integrations',
		i18nLabel: 'Integrations',
		icon: 'code',
		permissionGranted: (): boolean => settings.get('Webdav_Integration_Enabled'),
	},
	{
		href: 'tokens',
		i18nLabel: 'Personal_Access_Tokens',
		icon: 'key',
		permissionGranted: (): boolean => hasPermission('create-personal-access-tokens'),
	},
]);

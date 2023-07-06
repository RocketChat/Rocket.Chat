import { hasPermission, hasAtLeastOnePermission } from '../../../app/authorization/client';
import { settings } from '../../../app/settings/client';
import { createSidebarItems } from '../../lib/createSidebarItems';

export const {
	registerSidebarItem: registerAccountSidebarItem,
	unregisterSidebarItem,
	getSidebarItems: getAccountSidebarItems,
	subscribeToSidebarItems: subscribeToAccountSidebarItems,
} = createSidebarItems([
	{
		href: '/account/preferences',
		i18nLabel: 'Preferences',
		icon: 'customize',
	},
	{
		href: '/account/profile',
		i18nLabel: 'Profile',
		icon: 'user',
		permissionGranted: (): boolean => settings.get('Accounts_AllowUserProfileChange'),
	},
	{
		href: '/account/security',
		i18nLabel: 'Security',
		icon: 'lock',
		permissionGranted: (): boolean => settings.get('Accounts_TwoFactorAuthentication_Enabled') || settings.get('E2E_Enable'),
	},
	{
		href: '/account/integrations',
		i18nLabel: 'Integrations',
		icon: 'code',
		permissionGranted: (): boolean => settings.get('Webdav_Integration_Enabled'),
	},
	{
		href: '/account/tokens',
		i18nLabel: 'Personal_Access_Tokens',
		icon: 'key',
		permissionGranted: (): boolean => hasPermission('create-personal-access-tokens'),
	},
	{
		href: '/account/omnichannel',
		i18nLabel: 'Omnichannel',
		icon: 'headset',
		permissionGranted: (): boolean => hasAtLeastOnePermission(['send-omnichannel-chat-transcript', 'request-pdf-transcript']),
	},
]);

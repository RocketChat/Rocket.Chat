import { defaultFeaturesPreview, FeaturePreviewBadge } from '@rocket.chat/ui-client';

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
		href: '/account/profile',
		i18nLabel: 'Profile',
		icon: 'user',
		permissionGranted: (): boolean => settings.get('Accounts_AllowUserProfileChange'),
	},
	{
		href: '/account/preferences',
		i18nLabel: 'Preferences',
		icon: 'customize',
	},
	{
		href: '/account/security',
		i18nLabel: 'Security',
		icon: 'lock',
		permissionGranted: (): boolean =>
			settings.get('Accounts_TwoFactorAuthentication_Enabled') ||
			settings.get('E2E_Enable') ||
			settings.get('Accounts_AllowPasswordChange'),
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
	{
		href: '/account/feature-preview',
		i18nLabel: 'Feature_preview',
		icon: 'flask',
		badge: () => <FeaturePreviewBadge />,
		permissionGranted: () => settings.get('Accounts_AllowFeaturePreview') && defaultFeaturesPreview?.length > 0,
	},
	{
		href: '/account/accessibility-and-appearance',
		i18nLabel: 'Accessibility_and_Appearance',
		icon: 'person-arms-spread',
	},
]);

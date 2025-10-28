import { defaultFeaturesPreview, FeaturePreviewBadge } from '@rocket.chat/ui-client';

import { hasPermission, hasAtLeastOnePermission } from '../../../app/authorization/client';
import { createSidebarItems } from '../../lib/createSidebarItems';
import { settings } from '../../lib/settings';

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
		permissionGranted: (): boolean => settings.watch('Accounts_AllowUserProfileChange') ?? true,
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
			(settings.watch('Accounts_TwoFactorAuthentication_Enabled') ?? true) ||
			(settings.watch('E2E_Enable') ?? false) ||
			(settings.watch('Accounts_AllowPasswordChange') ?? true),
	},
	{
		href: '/account/integrations',
		i18nLabel: 'Integrations',
		icon: 'code',
		permissionGranted: (): boolean => settings.watch('Webdav_Integration_Enabled') ?? false,
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
		permissionGranted: () => settings.watch('Accounts_AllowFeaturePreview') && defaultFeaturesPreview?.length > 0,
	},
	{
		href: '/account/accessibility-and-appearance',
		i18nLabel: 'Accessibility_and_Appearance',
		icon: 'person-arms-spread',
	},
]);

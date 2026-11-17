import { Tag } from '@rocket.chat/fuselage';
import { defaultFeaturesPreview, FeaturePreviewBadge } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { hasPermission, hasAtLeastOnePermission } from '../../lib/authorization';
import { createSidebarItems } from '../../lib/createSidebarItems';
import { getSearchIndexBackend } from '../../lib/e2eeSearch/getSearchIndexBackend';
import { settings } from '../../lib/settings';

const ExperimentalBadge = () => {
	const { t } = useTranslation();
	return <Tag variant='featured'>{t('Experimental')}</Tag>;
};

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
		permissionGranted: (): boolean => settings.peek('Accounts_AllowUserProfileChange') ?? true,
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
			(settings.peek('Accounts_TwoFactorAuthentication_Enabled') ?? true) ||
			(settings.peek('E2E_Enable') ?? false) ||
			(settings.peek('Accounts_AllowPasswordChange') ?? true),
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
		permissionGranted: () => settings.peek('Accounts_AllowFeaturePreview') && defaultFeaturesPreview?.length > 0,
	},
	{
		href: '/account/local-search',
		i18nLabel: 'E2E_Local_Search_Page_Title',
		icon: 'magnifier',
		badge: () => <ExperimentalBadge />,
		permissionGranted: (): boolean => settings.peek('E2E_Enable') === true && !!getSearchIndexBackend(),
	},
	{
		href: '/account/accessibility-and-appearance',
		i18nLabel: 'Accessibility_and_Appearance',
		icon: 'person-arms-spread',
	},
]);

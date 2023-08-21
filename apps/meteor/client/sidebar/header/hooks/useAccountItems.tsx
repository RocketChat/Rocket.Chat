import { Badge } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { defaultFeaturesPreview, useFeaturePreviewList } from '@rocket.chat/ui-client';
import { useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import type { GenericMenuItemProps } from '../../../components/GenericMenu/GenericMenuItem';

export const useAccountItems = (): GenericMenuItemProps[] => {
	const t = useTranslation();
	const router = useRouter();

	const { unseenFeatures, featurePreviewEnabled } = useFeaturePreviewList();

	const handleMyAccount = useMutableCallback(() => {
		router.navigate('/account');
	});
	const handleThemes = useMutableCallback(() => {
		router.navigate('/account/theme');
	});
	const handlePreferences = useMutableCallback(() => {
		router.navigate('/account/preferences');
	});
	const handleFeaturePreview = useMutableCallback(() => {
		router.navigate('/account/feature-preview');
	});
	const handleAccessibility = useMutableCallback(() => {
		router.navigate('/account/accessibility');
	});

	const featurePreviewItem = {
		id: 'feature-preview',
		icon: 'flask' as const,
		content: t('Feature_preview'),
		onClick: handleFeaturePreview,
		...(unseenFeatures > 0 && {
			addon: (
				<Badge variant='primary' aria-label={t('Unseen_features')}>
					{unseenFeatures}
				</Badge>
			),
		}),
	};

	return [
		{
			id: 'profile',
			icon: 'user',
			content: t('Profile'),
			onClick: handleMyAccount,
		},
		{
			id: 'theme',
			icon: 'palette',
			content: t('Theme'),
			onClick: handleThemes,
		},
		{
			id: 'preferences',
			icon: 'customize',
			content: t('Preferences'),
			onClick: handlePreferences,
		},
		{
			id: 'accessibility',
			icon: 'person-arms-spread',
			content: t('Accessibility'),
			onClick: handleAccessibility,
		},
		...(featurePreviewEnabled && defaultFeaturesPreview.length > 0 ? [featurePreviewItem] : []),
	];
};

import { Badge } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { defaultFeaturesPreview, useFeaturePreviewList } from '@rocket.chat/ui-client';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import type { GenericMenuItemProps } from '../../../components/GenericMenu/GenericMenuItem';

export const useAccountItems = (): GenericMenuItemProps[] => {
	const t = useTranslation();
	const accountRoute = useRoute('account-index');
	const themesRoute = useRoute('themes');
	const preferencesRoute = useRoute('preferences');
	const featurePreviewRoute = useRoute('feature-preview');
	const { unseenFeatures, featurePreviewEnabled } = useFeaturePreviewList();

	const handleMyAccount = useMutableCallback(() => {
		accountRoute.push({});
	});
	const handleThemes = useMutableCallback(() => {
		themesRoute.push({});
	});
	const handlePreferences = useMutableCallback(() => {
		preferencesRoute.push({});
	});
	const handleFeaturePreview = useMutableCallback(() => {
		featurePreviewRoute.push();
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
			id: 'themes',
			icon: 'palette',
			content: t('Themes'),
			onClick: handleThemes,
		},
		{
			id: 'preferences',
			icon: 'customize',
			content: t('Preferences'),
			onClick: handlePreferences,
		},
		...(featurePreviewEnabled && defaultFeaturesPreview.length > 0 ? [featurePreviewItem] : []),
	];
};

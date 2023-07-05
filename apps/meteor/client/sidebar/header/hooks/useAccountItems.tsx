import { Badge } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useLogout, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import type { GenericMenuItemProps } from '../../../components/GenericMenu/GenericMenuItem';
import { useFeaturePreview } from '../../../hooks/useFeaturePreview';

export const useAccountItems = (): GenericMenuItemProps[] => {
	const t = useTranslation();
	const accountRoute = useRoute('account-index');
	const featurePreviewRoute = useRoute('feature-preview');
	const { newFeatures, defaultFeaturesPreview } = useFeaturePreview();

	const logout = useLogout();

	const handleMyAccount = useMutableCallback(() => {
		accountRoute.push({});
	});

	const handleFeaturePreview = useMutableCallback(() => {
		featurePreviewRoute.push();
	});

	const handleLogout = useMutableCallback(() => {
		logout();
	});

	const featurePreviewItem = {
		id: 'feature-preview',
		icon: 'flask' as const,
		content: t('Feature_preview'),
		onClick: handleFeaturePreview,
		...(newFeatures > 0 && {
			addon: () => <Badge variant='primary'>{newFeatures}</Badge>,
		}),
	};

	return [
		{
			id: 'my-account',
			icon: 'user',
			content: t('My_Account'),
			onClick: handleMyAccount,
		},
		...(defaultFeaturesPreview.length > 0 ? [featurePreviewItem] : []),
		{
			id: 'logout',
			icon: 'sign-out',
			content: t('Logout'),
			onClick: handleLogout,
		},
	];
};

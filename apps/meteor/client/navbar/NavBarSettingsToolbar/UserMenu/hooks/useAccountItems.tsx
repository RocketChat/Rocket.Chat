import { Badge } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { defaultFeaturesPreview, usePreferenceFeaturePreviewList } from '@rocket.chat/ui-client';
import { useRouter, useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';

import PatientPharmacyModal from '../../../../views/medsense/pharmacy/PatientPharmacyModal';
import { MedicalIcon } from '../../../../views/medsense/icons/MedicalIcon';

export const useAccountItems = (): GenericMenuItemProps[] => {
	const { t } = useTranslation();
	const router = useRouter();
	const setModal = useSetModal();

	const { unseenFeatures, featurePreviewEnabled } = usePreferenceFeaturePreviewList();

	const handleMyAccount = useEffectEvent(() => {
		router.navigate('/account');
	});
	const handleMyPharmacy = useEffectEvent(() => {
		setModal(<PatientPharmacyModal onClose={() => setModal(null)} />);
	});
	const handlePreferences = useEffectEvent(() => {
		router.navigate('/account/preferences');
	});
	const handleFeaturePreview = useEffectEvent(() => {
		router.navigate('/account/feature-preview');
	});
	const handleAccessibility = useEffectEvent(() => {
		router.navigate('/account/accessibility-and-appearance');
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
			id: 'my-pharmacy',
			iconElement: <MedicalIcon width='20px' height='20px' />,
			content: t('My_Pharmacy'),
			onClick: handleMyPharmacy,
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
			content: t('Accessibility_and_Appearance'),
			onClick: handleAccessibility,
		},
		...(featurePreviewEnabled && defaultFeaturesPreview.length > 0 ? [featurePreviewItem] : []),
	];
};

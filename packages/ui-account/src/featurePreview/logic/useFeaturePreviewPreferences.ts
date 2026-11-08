import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { FeaturePreviewProps } from '@rocket.chat/ui-client';
import { usePreferenceFeaturePreviewList } from '@rocket.chat/ui-client';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export type FeaturePreviewPreferencesViewModel = {
	features: FeaturePreviewProps[];
	save: (features: FeaturePreviewProps[]) => Promise<void>;
};

const toPreference = (features: FeaturePreviewProps[]) => features.map(({ name, value }) => ({ name, value }));

export const useFeaturePreviewPreferences = (): FeaturePreviewPreferencesViewModel => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { features, unseenFeatures } = usePreferenceFeaturePreviewList();
	const setUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	// Opening the page counts as having seen every new feature.
	useEffect(() => {
		if (unseenFeatures) {
			void setUserPreferences({ data: { featuresPreview: toPreference(features) } });
		}
	}, [setUserPreferences, features, unseenFeatures]);

	const save = useStableCallback(async (featuresPreview: FeaturePreviewProps[]) => {
		try {
			await setUserPreferences({ data: { featuresPreview: toPreference(featuresPreview) } });
			dispatchToastMessage({ type: 'success', message: t('Preferences_saved') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return { features, save };
};

import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { FeaturePreviewProps, parseSetting, useFeaturePreviewList } from './useFeaturePreviewList';

export const usePreferenceFeaturePreviewList = () => {
	const featurePreviewEnabled = useSetting<boolean>('Accounts_AllowFeaturePreview');
	const userFeaturesPreviewPreference = useUserPreference<FeaturePreviewProps[]>('featuresPreview');
	const userFeaturesPreview = useMemo(() => parseSetting(userFeaturesPreviewPreference), [userFeaturesPreviewPreference]);
	const { unseenFeatures, features } = useFeaturePreviewList(userFeaturesPreview ?? []);

	if (!featurePreviewEnabled) {
		return { unseenFeatures: 0, features: [] as FeaturePreviewProps[], featurePreviewEnabled };
	}
	return { unseenFeatures, features, featurePreviewEnabled };
};

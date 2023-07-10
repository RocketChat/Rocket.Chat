import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';

import type { FeaturesAvailable, FeaturePreviewProps } from './useFeaturePreviewList';

export const useFeaturePreview = (featureName: FeaturesAvailable) => {
	const featurePreviewEnabled = useSetting('Accounts_AllowFeaturePreview');

	const features = useUserPreference<FeaturePreviewProps[]>('featuresPreview');

	const currentFeature = features?.find((feature) => feature.name === featureName);

	if (!featurePreviewEnabled) {
		return false;
	}

	if (!currentFeature) {
		return false;
	}

	return currentFeature.value;
};

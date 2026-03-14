import type { FeaturesAvailable } from './useFeaturePreviewList';
import { usePreferenceFeaturePreviewList } from './usePreferenceFeaturePreviewList';

export const useFeaturePreview = (featureName: FeaturesAvailable) => {
	const { features } = usePreferenceFeaturePreviewList();

	const currentFeature = features?.find((feature) => feature.name === featureName);

	if (!currentFeature) {
		return false;
	}
	if (currentFeature.disabled) {
		return false;
	}

	if (currentFeature.enableQuery) {
		const requiredFeature = features?.find((f) => f.name === currentFeature.enableQuery?.name);

		if (requiredFeature?.disabled || requiredFeature?.value !== currentFeature.enableQuery.value) {
			return false;
		}
	}

	return Boolean(currentFeature.value);
};

import { type FeaturesAvailable } from './useFeaturePreviewList';
import { usePreferenceFeaturePreviewList } from './usePreferenceFeaturePreviewList';

export const useFeaturePreview = (featureName: FeaturesAvailable) => {
	const { features } = usePreferenceFeaturePreviewList();

	const currentFeature = features?.find((feature) => feature.name === featureName);

	return Boolean(currentFeature?.value);
};

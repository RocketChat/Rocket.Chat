import { type FeaturesAvailable, useFeaturePreviewList } from './useFeaturePreviewList';

export const useFeaturePreview = (featureName: FeaturesAvailable) => {
	const { features } = useFeaturePreviewList();

	const currentFeature = features?.find((feature) => feature.name === featureName);

	return Boolean(currentFeature?.value);
};

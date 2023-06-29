import { useUserPreference } from '@rocket.chat/ui-contexts';

type FeaturesAvailable = 'newNavbar' | 'contextualbarResizable';

export const useFeaturePreview = (featureName: FeaturesAvailable) => {
	const features = useUserPreference('featuresPreview') as { name: string; value: boolean }[];
	const currentFeature = features.find((feature) => feature.name === featureName);

	if (!currentFeature) {
		throw new Error(`Feature ${featureName} not found`);
	}

	return currentFeature.value;
};

import { useUserPreference } from '@rocket.chat/ui-contexts';

type FeaturesAvailable = 'quickReactions';

export const useFeaturePreviewValue = (featureName: FeaturesAvailable) => {
	const features = useUserPreference('featuresPreview') as { name: string; value: boolean }[];
	const currentFeature = features?.find((feature) => feature.name === featureName);

	if (!currentFeature) {
		console.error(`Feature ${featureName} not found`);
		return false;
	}

	return currentFeature.value;
};

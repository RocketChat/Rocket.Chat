import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useUserPreference } from '@rocket.chat/ui-contexts';

type FeaturePreviewProps = {
	name: string;
	i18n: TranslationKey;
	description: TranslationKey;
	group: 'messages' | 'navigation';
	value: boolean;
};

export const defaultFeaturesPreview: FeaturePreviewProps[] = [
	{
		name: 'quickReactions',
		i18n: 'Quick_reactions',
		description: 'Quick_reactions_description',
		group: 'messages',
		value: false,
	},
];

export const useFeaturePreview = () => {
	const userFeaturesPreview = useUserPreference<FeaturePreviewProps[]>('featuresPreview');

	const newFeatures = defaultFeaturesPreview.filter(
		(feature) => !userFeaturesPreview?.find((userFeature) => userFeature.name === feature.name),
	).length;

	const mergedFeatures = defaultFeaturesPreview.map((feature) => {
		const userFeature = userFeaturesPreview?.find((userFeature) => userFeature.name === feature.name);
		return { ...feature, ...userFeature };
	});

	return { newFeatures, features: mergedFeatures, defaultFeaturesPreview };
};

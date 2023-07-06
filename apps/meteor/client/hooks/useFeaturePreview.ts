import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';

export type FeaturesAvailable = 'quickReactions';

export type FeaturePreviewProps = {
	name: FeaturesAvailable;
	i18n: TranslationKey;
	description: TranslationKey;
	group: 'Message' | 'Navigation';
	imageUrl?: string;
	value: boolean;
};

export const defaultFeaturesPreview: FeaturePreviewProps[] = [
	{
		name: 'quickReactions',
		i18n: 'Quick_reactions',
		description: 'Quick_reactions_description',
		group: 'Message',
		imageUrl: 'images/featurePreview/quick-reactions.png',
		value: false,
	},
];

export const useFeaturePreview = () => {
	const featurePreviewEnabled = useSetting('Accounts_AllowFeaturePreview');
	const userFeaturesPreview = useUserPreference<FeaturePreviewProps[]>('featuresPreview');

	const newFeatures = defaultFeaturesPreview.filter(
		(feature) => !userFeaturesPreview?.find((userFeature) => userFeature.name === feature.name),
	).length;

	const mergedFeatures = defaultFeaturesPreview.map((feature) => {
		const userFeature = userFeaturesPreview?.find((userFeature) => userFeature.name === feature.name);
		return { ...feature, ...userFeature };
	});

	if (!featurePreviewEnabled) {
		return { newFeatures: 0, features: [], defaultFeaturesPreview: [] };
	}

	return { newFeatures, features: mergedFeatures, defaultFeaturesPreview };
};

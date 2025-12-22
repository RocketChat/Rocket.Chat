import type { TranslationKey } from '@rocket.chat/ui-contexts';

export type FeaturesAvailable = 'secondarySidebar' | 'expandableMessageComposer';

export type FeaturePreviewProps = {
	name: FeaturesAvailable;
	i18n: TranslationKey;
	description: TranslationKey;
	group: 'Message' | 'Navigation';
	imageUrl?: string;
	value: boolean;
	enabled: boolean;
	disabled?: boolean;
	enableQuery?: {
		name: FeaturesAvailable;
		value: boolean;
	};
};

// TODO: Move the features preview array to another directory to be accessed from both BE and FE.
export const defaultFeaturesPreview: FeaturePreviewProps[] = [
	{
		name: 'secondarySidebar',
		i18n: 'Filters_and_secondary_sidebar',
		description: 'Filters_and_secondary_sidebar_description',
		group: 'Navigation',
		imageUrl: 'images/featurePreview/secondary-sidebar.png',
		value: false,
		enabled: true,
	},
];

export const enabledDefaultFeatures = defaultFeaturesPreview.filter((feature) => feature.enabled);

// TODO: Remove this logic after we have a way to store object settings.
export const parseSetting = (setting?: FeaturePreviewProps[] | string) => {
	if (typeof setting === 'string') {
		try {
			return JSON.parse(setting) as FeaturePreviewProps[];
		} catch (_) {
			return;
		}
	}
	return setting;
};

export const useFeaturePreviewList = (featuresList: FeaturePreviewProps[]) => {
	const unseenFeatures = enabledDefaultFeatures.filter(
		(defaultFeature) => !featuresList?.find((feature) => feature.name === defaultFeature.name),
	).length;

	const mergedFeatures = enabledDefaultFeatures.map((defaultFeature) => {
		const feature = featuresList?.find((feature) => feature.name === defaultFeature.name);
		// overwrite enableQuery and disabled with default value to avoid a migration to remove this from the DB
		// payload on save now only have `name` and `value`
		if (feature) {
			feature.enableQuery = defaultFeature.enableQuery;
			feature.disabled = defaultFeature.disabled;
		}
		return { ...defaultFeature, ...feature };
	});

	return { unseenFeatures, features: mergedFeatures };
};

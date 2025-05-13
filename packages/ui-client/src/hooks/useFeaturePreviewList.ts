import type { TranslationKey } from '@rocket.chat/ui-contexts';

export type FeaturesAvailable =
	| 'quickReactions'
	| 'enable-timestamp-message-parser'
	| 'contextualbarResizable'
	| 'newNavigation'
	| 'sidepanelNavigation';

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
		name: 'quickReactions',
		i18n: 'Quick_reactions',
		description: 'Quick_reactions_description',
		group: 'Message',
		imageUrl: 'images/featurePreview/quick-reactions.png',
		value: false,
		enabled: true,
	},
	{
		name: 'enable-timestamp-message-parser',
		i18n: 'Enable_timestamp',
		description: 'Enable_timestamp_description',
		group: 'Message',
		imageUrl: 'images/featurePreview/timestamp.png',
		value: false,
		enabled: true,
	},
	{
		name: 'contextualbarResizable',
		i18n: 'Contextualbar_resizable',
		description: 'Contextualbar_resizable_description',
		group: 'Navigation',
		imageUrl: 'images/featurePreview/resizable-contextual-bar.png',
		value: false,
		enabled: true,
	},
	{
		name: 'newNavigation',
		i18n: 'New_navigation',
		description: 'New_navigation_description',
		group: 'Navigation',
		imageUrl: 'images/featurePreview/enhanced-navigation.png',
		value: false,
		enabled: true,
	},
	{
		name: 'sidepanelNavigation',
		i18n: 'Sidepanel_navigation',
		description: 'Sidepanel_navigation_description',
		group: 'Navigation',
		value: false,
		enabled: true,
		enableQuery: {
			name: 'newNavigation',
			value: true,
		},
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

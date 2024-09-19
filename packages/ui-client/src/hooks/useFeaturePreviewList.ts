import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export type FeaturesAvailable =
	| 'quickReactions'
	| 'navigationBar'
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
		name: 'navigationBar',
		i18n: 'Navigation_bar',
		description: 'Navigation_bar_description',
		group: 'Navigation',
		value: false,
		enabled: false,
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
		enabled: false,
		enableQuery: {
			name: 'newNavigation',
			value: true,
		},
	},
];

export const enabledDefaultFeatures = defaultFeaturesPreview.filter((feature) => feature.enabled);

// TODO: Remove this logic after we have a way to store object settings.
const parseSetting = (setting: FeaturePreviewProps[] | string) => {
	if (typeof setting === 'string') {
		return JSON.parse(setting);
	}
	return setting;
};

export const usePreferenceFeaturePreviewList = () => {
	const featurePreviewEnabled = useSetting<boolean>('Accounts_AllowFeaturePreview');
	const userFeaturesPreviewPreference = useUserPreference<FeaturePreviewProps[]>('featuresPreview');
	const userFeaturesPreview = useMemo<FeaturePreviewProps[]>(
		() => parseSetting(userFeaturesPreviewPreference!),
		[userFeaturesPreviewPreference],
	);
	const { unseenFeatures, features } = useFeaturePreviewList(userFeaturesPreview);

	if (!featurePreviewEnabled) {
		return { unseenFeatures: 0, features: [] as FeaturePreviewProps[], featurePreviewEnabled };
	}
	return { unseenFeatures, features, featurePreviewEnabled };
};

export const useDefaultSettingFeaturePreviewList = () => {
	const featurePreviewSettingJSON = useSetting<string>('Accounts_Default_User_Preferences_featuresPreview');

	const settingFeaturePreview = useMemo<FeaturePreviewProps[]>(() => parseSetting(featurePreviewSettingJSON!), [featurePreviewSettingJSON]);

	return useFeaturePreviewList(settingFeaturePreview);
};

export const useFeaturePreviewList = (featuresList: Pick<FeaturePreviewProps, 'name' | 'value'>[]) => {
	const unseenFeatures = enabledDefaultFeatures.filter(
		(defaultFeature) => !featuresList?.find((feature) => feature.name === defaultFeature.name),
	).length;

	const mergedFeatures = enabledDefaultFeatures.map((defaultFeature) => {
		const features = featuresList?.find((feature) => feature.name === defaultFeature.name);
		return { ...defaultFeature, ...features };
	});

	return { unseenFeatures, features: mergedFeatures };
};

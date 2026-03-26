import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { FeaturePreviewProps, FeaturePreviewSetting } from './useFeaturePreviewList';
import { enabledDefaultFeatures, parseSetting, useFeaturePreviewList } from './useFeaturePreviewList';

export const usePreferenceFeaturePreviewList = () => {
	const featurePreviewEnabled = useSetting('Accounts_AllowFeaturePreview', false);
	const defaultFeaturesPreviewSetting = useSetting('Accounts_Default_User_Preferences_featuresPreview', '[]');
	const userFeaturesPreviewPreference = useUserPreference<FeaturePreviewSetting[]>('featuresPreview');

	const defaultFeaturesPreview = useMemo(() => {
		const parsed = parseSetting(defaultFeaturesPreviewSetting);
		return Array.isArray(parsed) ? parsed : [];
	}, [defaultFeaturesPreviewSetting]);

	const userFeaturesPreview = useMemo(() => {
		const parsed = parseSetting(userFeaturesPreviewPreference);
		return Array.isArray(parsed) ? parsed : [];
	}, [userFeaturesPreviewPreference]);

	const featuresPreview = useMemo(() => {
		const defaultValues = defaultFeaturesPreview.reduce<Partial<Record<string, boolean>>>((acc, { name, value }) => {
			acc[name] = value;
			return acc;
		}, {});
		const userValues = userFeaturesPreview.reduce<Partial<Record<string, boolean>>>((acc, { name, value }) => {
			acc[name] = value;
			return acc;
		}, {});

		return enabledDefaultFeatures.map(({ name, value }) => ({
			name,
			value: userValues[name] ?? defaultValues[name] ?? value,
		}));
	}, [defaultFeaturesPreview, userFeaturesPreview]);
	const { unseenFeatures, features } = useFeaturePreviewList(featuresPreview);

	if (!featurePreviewEnabled) {
		return { unseenFeatures: 0, features: [] as FeaturePreviewProps[], featurePreviewEnabled };
	}
	return { unseenFeatures, features, featurePreviewEnabled };
};

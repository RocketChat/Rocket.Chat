import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { parseSetting, useFeaturePreviewList } from './useFeaturePreviewList';

export const useDefaultSettingFeaturePreviewList = () => {
	const featurePreviewSettingJSON = useSetting<string>('Accounts_Default_User_Preferences_featuresPreview');

	const settingFeaturePreview = useMemo(() => parseSetting(featurePreviewSettingJSON), [featurePreviewSettingJSON]);

	return useFeaturePreviewList(settingFeaturePreview ?? []);
};

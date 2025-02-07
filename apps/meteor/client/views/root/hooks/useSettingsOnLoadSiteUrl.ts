import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useSettingsOnLoadSiteUrl = () => {
	const siteUrl = useSetting('Site_Url') as string;

	useEffect(() => {
		const value = siteUrl;
		if (value == null || value.trim() === '') {
			return;
		}
		(window as any).__meteor_runtime_config__.ROOT_URL = value;
	}, [siteUrl]);
};

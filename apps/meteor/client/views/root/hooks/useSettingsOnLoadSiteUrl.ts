import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useSettingsOnLoadSiteUrl = () => {
	const siteUrl = useSetting('Site_Url') as string;

	useEffect(() => {
		const value = siteUrl;
		if (value == null || value.trim() === '') {
			return;
		}
		if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
			return;
		}
		(window as any).__meteor_runtime_config__.ROOT_URL = value;
	}, [siteUrl]);
};

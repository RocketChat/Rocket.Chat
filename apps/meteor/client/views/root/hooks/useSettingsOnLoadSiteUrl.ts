import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { setRootUrl } from '../../../lib/meteorRuntimeConfig';

export const useSettingsOnLoadSiteUrl = () => {
	const siteUrl = useSetting('Site_Url') as string;

	useEffect(() => {
		const value = siteUrl;
		if (value == null || value.trim() === '') {
			return;
		}
		setRootUrl(value);
	}, [siteUrl]);
};

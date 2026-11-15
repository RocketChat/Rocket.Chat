import { useAbsoluteUrl, useAssetPath } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { callDesktopBridge } from '../../../lib/utils/callDesktopBridge';

export const useDesktopFavicon = () => {
	const absoluteUrl = useAbsoluteUrl();

	useEffect(() => {
		callDesktopBridge((desktop) => desktop.setUrlResolver((relativePath?: string) => absoluteUrl(relativePath ?? '/')));
	}, [absoluteUrl]);

	const faviconUrl = useAssetPath('favicon');

	useEffect(() => {
		if (!faviconUrl) return;
		callDesktopBridge((desktop) => desktop.setFavicon(faviconUrl));
	}, [faviconUrl]);
};

import { useAbsoluteUrl, useAssetPath } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useDesktopFavicon = () => {
	const absoluteUrl = useAbsoluteUrl();

	useEffect(() => {
		if (typeof window === 'undefined') return;
		window.RocketChatDesktop?.setUrlResolver((relativePath?: string) => absoluteUrl(relativePath ?? '/'));
	}, [absoluteUrl]);

	const faviconUrl = useAssetPath('favicon');

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (!faviconUrl) return;
		window.RocketChatDesktop?.setFavicon(faviconUrl);
	}, [faviconUrl]);
};

import { useAbsoluteUrl, useAssetPath } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

const { RocketChatDesktop } = window;

export const useDesktopFavicon = () => {
	const absoluteUrl = useAbsoluteUrl();

	useEffect(() => {
		RocketChatDesktop?.setUrlResolver((relativePath?: string) => absoluteUrl(relativePath ?? '/'));
	}, [absoluteUrl]);

	const faviconUrl = useAssetPath('favicon');

	useEffect(() => {
		if (!faviconUrl) return;
		RocketChatDesktop?.setFavicon(faviconUrl);
	}, [faviconUrl]);
};

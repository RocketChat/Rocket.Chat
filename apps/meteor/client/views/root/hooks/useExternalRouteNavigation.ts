import type { LocationPathname } from '@rocket.chat/ui-contexts';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

// A conference window (opened via window.open) posts this to its opener — the main app — to request
// an in-app route change instead of a full-page navigation/reload.
export const NAVIGATE_TO_ROUTE_MESSAGE = 'rocketchat:navigate-to-route';

// Lets other windows ask the main app window to navigate (client-side):
// - desktop app, via the RocketChatDesktop bridge (link clicked in the internal video-chat window);
// - browser, via a postMessage from a conference tab to its opener.
export const useExternalRouteNavigation = () => {
	const router = useRouter();

	useEffect(() => {
		if (typeof window === 'undefined') {
			return undefined;
		}

		window.RocketChatDesktop?.onNavigateToRoute?.((path) => router.navigate(path as LocationPathname));

		const handleMessage = (event: MessageEvent) => {
			// Same-origin only — the conference tab runs the same app on the same origin.
			if (event.origin !== window.location.origin) {
				return;
			}
			const data = event.data as { type?: unknown; path?: unknown } | null;
			if (data?.type !== NAVIGATE_TO_ROUTE_MESSAGE || typeof data.path !== 'string') {
				return;
			}
			router.navigate(data.path as LocationPathname);
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [router]);
};

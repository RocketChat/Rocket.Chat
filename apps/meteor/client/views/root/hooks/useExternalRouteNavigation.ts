import type { LocationPathname } from '@rocket.chat/ui-contexts';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

/** What a call window sends its opener to ask for a route change rather than a page load. */
export const NAVIGATE_TO_ROUTE_MESSAGE = 'rocketchat:navigate-to-route';

/**
 * Lets another window ask this one to navigate, so a link followed in a call window lands here.
 *
 * Two ways in, because a call window has an opener in a browser and none in the desktop app, where it is a
 * window of its own and the bridge stands in for one.
 */
export const useExternalRouteNavigation = () => {
	const router = useRouter();

	useEffect(() => {
		if (typeof window === 'undefined') {
			return undefined;
		}

		window.RocketChatDesktop?.onNavigateToRoute?.((path) => router.navigate(path as LocationPathname));

		const handleMessage = (event: MessageEvent) => {
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

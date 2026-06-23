import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

// The desktop app can ask the main app window to navigate — e.g. when a link/mention is clicked in
// the internal video-chat window (which has no `window.opener`). Perform a client-side route change.
export const useDesktopRouteNavigation = () => {
	const router = useRouter();

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}
		window.RocketChatDesktop?.onNavigateToRoute?.((path) => router.navigate(path));
	}, [router]);
};

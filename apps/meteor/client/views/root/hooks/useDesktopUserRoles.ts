import { useUser } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

/**
 * Pushes the logged-in user's roles to the desktop app so it can decide which
 * supportedVersions messages to show (e.g. restricting version-expiration
 * warnings to admins). The desktop app falls back to its own role lookup when
 * this bridge is unavailable, so `setUserRoles` is called optionally.
 */
export const useDesktopUserRoles = () => {
	const user = useUser();
	const userId = user?._id;
	const rolesKey = user?.roles?.join(',');

	useEffect(() => {
		if (typeof window === 'undefined') return;
		// On logout or account switch clear any previously-pushed roles instead of
		// leaving stale ones cached in the desktop app.
		if (!userId) {
			window.RocketChatDesktop?.setUserRoles?.([]);
			return;
		}
		window.RocketChatDesktop?.setUserRoles?.(rolesKey ? rolesKey.split(',') : []);
	}, [userId, rolesKey]);
};

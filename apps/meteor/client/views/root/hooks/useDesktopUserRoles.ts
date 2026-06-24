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
		// Clear stale roles on logout/account switch by pushing [] when there is no
		// user, rather than in an effect cleanup: the cleanup runs on every deps
		// change (including a roles update while staying logged in), which would
		// push [] and then the new roles, briefly flickering role-targeted UI.
		// Handling it inline only clears when the user actually goes away.
		if (!userId) {
			window.RocketChatDesktop?.setUserRoles?.([]);
			return;
		}
		window.RocketChatDesktop?.setUserRoles?.(rolesKey ? rolesKey.split(',') : []);
	}, [userId, rolesKey]);
};

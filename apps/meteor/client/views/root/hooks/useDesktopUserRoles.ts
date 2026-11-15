import { useUser } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

/**
 * Pushes the logged-in user's roles to the desktop app so it can decide which
 * supportedVersions messages to show (e.g. restricting version-expiration
 * warnings to admins). The desktop app falls back to its own role lookup when
 * this bridge is unavailable, so `setUserRoles` is called optionally.
 */
export const useDesktopUserRoles = () => {
	// A single canonical value derived from the reactive user. Logout, login and
	// account switch all surface as a change to this key, so the effect re-runs
	// and re-pushes only when the roles actually change — no userId branch and no
	// effect cleanup (which would fire on every deps change and flicker
	// role-targeted UI). Logged-out and "logged in with no roles" both resolve to
	// an empty list, which is the correct signal for the desktop either way.
	const rolesKey = (useUser()?.roles ?? []).join(',');

	useEffect(() => {
		if (typeof window === 'undefined') return;
		window.RocketChatDesktop?.setUserRoles?.(rolesKey ? rolesKey.split(',') : []);
	}, [rolesKey]);
};

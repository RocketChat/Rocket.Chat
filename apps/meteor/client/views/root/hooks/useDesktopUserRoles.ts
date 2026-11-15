import { useUser, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import { callDesktopBridge } from '../../../lib/utils/callDesktopBridge';

/**
 * Pushes the logged-in user's roles to the desktop app so it can decide which
 * supportedVersions messages to show (e.g. restricting version-expiration
 * warnings to admins). The desktop app trusts the first pushed list over its
 * own role lookup, so only resolved roles are pushed: an empty list goes out
 * for a loaded user with no roles, and once on logout.
 */
export const useDesktopUserRoles = () => {
	const loggedOut = !useUserId();
	const rolesKey = useUser()?.roles?.join(',');
	const pushed = useRef(false);

	useEffect(() => {
		if (rolesKey !== undefined) {
			pushed.current = true;
			callDesktopBridge((desktop) => desktop.setUserRoles?.(rolesKey ? rolesKey.split(',') : []));
			return;
		}

		if (loggedOut && pushed.current) {
			pushed.current = false;
			callDesktopBridge((desktop) => desktop.setUserRoles?.([]));
		}
	}, [rolesKey, loggedOut]);
};

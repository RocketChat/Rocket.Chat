import { useIsLoggingIn, useLoginToken, useUser, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import { callDesktopBridge } from '../../../lib/utils/callDesktopBridge';

/**
 * Gives the desktop app what its Outlook calendar integration needs while the user has the integration on, and takes it
 * back once the user turns it off or logs out.
 */
export const useDesktopOutlookCredentials = () => {
	const user = useUser();
	const storedUserId = useUserId();
	const isLoggingIn = useIsLoggingIn();
	const token = useLoginToken();

	const userId = user?._id;
	const outlook = user?.settings?.calendar?.outlook;
	const exchangeUrl = outlook?.Enabled ? outlook.Exchange_Url : undefined;

	// Until a stored session resumes and the user loads, whether the user has the integration on is unknown.
	const settled = !isLoggingIn && (!storedUserId || Boolean(user));

	// The desktop app keeps the credentials across page loads, so it may hold some before this page hands any over.
	const desktopMayHoldCredentials = useRef(true);

	useEffect(() => {
		if (userId && token && exchangeUrl) {
			callDesktopBridge((desktop) => desktop.setUserToken?.(token, userId));
			callDesktopBridge((desktop) => desktop.setOutlookExchangeUrl?.(exchangeUrl, userId));
			desktopMayHoldCredentials.current = true;
			return;
		}

		if (settled && desktopMayHoldCredentials.current) {
			desktopMayHoldCredentials.current = false;
			callDesktopBridge((desktop) => desktop.clearOutlookCredentials?.());
		}
	}, [userId, token, exchangeUrl, settled]);
};

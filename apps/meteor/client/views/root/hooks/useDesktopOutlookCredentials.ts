import { useUser } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useStoredItem } from '../../../hooks/useStoredItem';
import { STORAGE_KEYS } from '../../../lib/sdk/storage';

/**
 * Passes the login token and the user's Exchange URL to the desktop app, which
 * needs both to sync Outlook calendar events into Rocket.Chat. The push runs
 * only when the user turned on the Outlook calendar and set an Exchange URL.
 * It runs again when the token, the user or the URL changes. On the Meteor
 * build the desktop's injected script may push the same values too: the
 * desktop app replaces its sync timer on each push, so a repeat push does not
 * start a second sync loop. The members are called optionally.
 */
export const useDesktopOutlookCredentials = () => {
	const user = useUser();
	const userId = user?._id;
	const outlook = user?.settings?.calendar?.outlook;
	const exchangeUrl = outlook?.Enabled ? outlook.Exchange_Url : undefined;
	const token = useStoredItem(STORAGE_KEYS.LOGIN_TOKEN);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (!userId || !token || !exchangeUrl) return;

		// The URL goes first: the desktop app stores the token only for a user
		// whose Exchange URL it already has.
		window.RocketChatDesktop?.setOutlookExchangeUrl?.(exchangeUrl, userId);
		window.RocketChatDesktop?.setUserToken?.(token, userId);
	}, [userId, token, exchangeUrl]);
};

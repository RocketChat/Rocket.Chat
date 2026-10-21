import type { IUser } from '@rocket.chat/core-typings';
import { useLoginToken } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { callDesktopBridge } from '../../../../lib/utils/callDesktopBridge';

/** Gives the desktop app what its Outlook calendar integration needs once the user turned the integration on. */
export const useDesktopOutlookCredentials = (user: Pick<IUser, '_id' | 'settings'>) => {
	const token = useLoginToken();

	const userId = user._id;
	const outlook = user.settings?.calendar?.outlook;
	const exchangeUrl = outlook?.Enabled ? outlook.Exchange_Url : undefined;

	useEffect(() => {
		if (!token || !exchangeUrl) {
			return;
		}

		callDesktopBridge((desktop) => desktop.setUserToken(token, userId));
		callDesktopBridge((desktop) => desktop.setOutlookExchangeUrl(exchangeUrl, userId));
	}, [userId, token, exchangeUrl]);
};

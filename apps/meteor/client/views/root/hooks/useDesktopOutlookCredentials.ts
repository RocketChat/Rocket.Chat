import { useLoginToken, useUser } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import { callDesktopBridge } from '../../../lib/utils/callDesktopBridge';

/**
 * Gives the desktop app what its Outlook calendar integration needs while the user has the integration on, and takes it
 * back once the user turns it off or logs out.
 */
export const useDesktopOutlookCredentials = () => {
	const user = useUser();
	const token = useLoginToken();

	const userId = user?._id;
	const outlook = user?.settings?.calendar?.outlook;
	const exchangeUrl = outlook?.Enabled ? outlook.Exchange_Url : undefined;

	const handedOver = useRef(false);

	useEffect(() => {
		if (userId && token && exchangeUrl) {
			callDesktopBridge((desktop) => desktop.setUserToken(token, userId));
			callDesktopBridge((desktop) => desktop.setOutlookExchangeUrl(exchangeUrl, userId));
			handedOver.current = true;
			return;
		}

		if (handedOver.current) {
			handedOver.current = false;
			callDesktopBridge((desktop) => desktop.clearOutlookCredentials());
		}
	}, [userId, token, exchangeUrl]);
};

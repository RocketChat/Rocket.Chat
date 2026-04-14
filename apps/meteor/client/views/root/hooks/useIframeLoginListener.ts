import { useUnstoreLoginToken } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useIframe } from './useIframe';

export const useIframeLoginListener = () => {
	const { enabled: iframeEnabled, tryLogin, loginWithToken } = useIframe();
	const unstoreLoginToken = useUnstoreLoginToken();

	useEffect(() => {
		if (!iframeEnabled) {
			return;
		}
		tryLogin();
	}, [iframeEnabled, tryLogin]);

	useEffect(() => {
		if (!iframeEnabled) {
			return;
		}
		const messageListener = (e: MessageEvent) => {
			if (!(typeof e.data === 'function' || (typeof e.data === 'object' && !!e.data))) {
				return;
			}

			switch (e.data.event) {
				case 'try-iframe-login':
					tryLogin((error) => {
						if (error) {
							e.source?.postMessage(
								{
									event: 'login-error',
									response: error.message,
								},
								{ targetOrigin: e.origin },
							);
						}
					});
					break;

				case 'login-with-token':
					loginWithToken(e.data, (error) => {
						if (error) {
							e.source?.postMessage(
								{
									event: 'login-error',
									response: error.message,
								},
								{ targetOrigin: e.origin },
							);
						}
					});
					break;
			}
		};

		window.addEventListener('message', messageListener);
		return () => {
			window.removeEventListener('message', messageListener);
		};
	}, [iframeEnabled, loginWithToken, tryLogin]);

	useEffect(() => unstoreLoginToken(tryLogin), [tryLogin, unstoreLoginToken]);
};

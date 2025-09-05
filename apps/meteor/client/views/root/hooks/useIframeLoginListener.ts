import { useEffect } from 'react';

import { useIframe } from './useIframe';
import { userStorage, LOGIN_TOKEN_KEY } from '../../../lib/user';

export const useIframeLoginListener = () => {
	const { enabled: iframeEnabled, tryLogin, loginWithToken } = useIframe();

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

	useEffect(
		() =>
			userStorage.on('change', () => {
				const loginToken = userStorage.getItem(LOGIN_TOKEN_KEY);
				if (loginToken) return;

				tryLogin();
			}),
		[tryLogin],
	);
};

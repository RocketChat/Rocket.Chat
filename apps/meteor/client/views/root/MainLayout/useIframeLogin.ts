import { useSetting, useLoginWithIframe, useUnstoreLoginToken } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';

export const useIframeLogin = (): string | undefined => {
	const iframeEnabled = useSetting('Accounts_iframe_enabled', false);
	const iframeUrl = useSetting('Accounts_iframe_url', '');
	const apiUrl = useSetting('Accounts_Iframe_api_url', '');
	const apiMethod = useSetting('Accounts_Iframe_api_method', '');
	const iframeLogin = useLoginWithIframe();
	const unstoreLoginToken = useUnstoreLoginToken();

	const [reactiveIframeUrl, setReactiveIframeUrl] = useState<string | undefined>(undefined);

	const loginWithToken = useCallback(
		(tokenData: string | { loginToken: string } | { token: string }, callback?: (error: Error | null | undefined) => void) => {
			if (!iframeEnabled) {
				return;
			}

			if (typeof tokenData === 'string') {
				tokenData = {
					token: tokenData,
				};
			}
			console.log('loginWithToken');

			if ('loginToken' in tokenData) {
				return Meteor.loginWithToken(tokenData.loginToken, callback);
			}

			iframeLogin(tokenData.token, callback);
		},
		[iframeEnabled, iframeLogin],
	);

	const tryLogin = useCallback(
		async (callback?: (error: Error | null | undefined, result: unknown) => void) => {
			if (!iframeEnabled) {
				return;
			}

			if (!iframeUrl || !apiUrl || !apiMethod) {
				return;
			}

			console.log('tryLogin');

			let url = iframeUrl;
			let separator = '?';
			if (url.indexOf('?') > -1) {
				separator = '&';
			}

			if (navigator.userAgent.indexOf('Electron') > -1) {
				url += `${separator}client=electron`;
			}

			const result = await fetch(apiUrl, {
				method: apiMethod,
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			});

			if (!result.ok || result.status !== 200) {
				setReactiveIframeUrl(url);
				callback?.(new Error(), null);
				return;
			}

			loginWithToken(await result.json(), async (error: Meteor.Error | Meteor.TypedError | Error | null | undefined) => {
				if (error) {
					setReactiveIframeUrl(url);
				} else {
					setReactiveIframeUrl(undefined);
				}
				callback?.(error, await result.json());
			});
		},
		[apiMethod, apiUrl, iframeEnabled, iframeUrl, loginWithToken],
	);

	useEffect(() => {
		if (!iframeEnabled) {
			return;
		}

		if (iframeEnabled && iframeUrl && apiUrl && apiMethod) {
			tryLogin();
		}
	}, [apiMethod, apiUrl, iframeEnabled, iframeUrl, tryLogin]);

	useEffect(() => {
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
	}, [loginWithToken, tryLogin]);

	useEffect(() => {
		const cleanup = unstoreLoginToken(tryLogin);
		return () => cleanup();
	}, [tryLogin, unstoreLoginToken]);

	return reactiveIframeUrl;
};

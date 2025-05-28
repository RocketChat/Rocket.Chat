import { useSetting } from '@rocket.chat/ui-contexts';
import { Accounts } from 'meteor/accounts-base';
import { HTTP } from 'meteor/http';
import { useCallback, useEffect, useState } from 'react';

import { useLoginMethod } from '../hooks/useLoginMethod';

export const useIframeLogin = (): string | undefined => {
	const iframeEnabled = useSetting('Accounts_iframe_enabled', false);
	const iframeUrl = useSetting('Accounts_iframe_url', '');
	const apiUrl = useSetting('Accounts_Iframe_api_url', '');
	const apiMethod = useSetting('Accounts_Iframe_api_method', '');
	const loginMethod = useLoginMethod();

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

			loginMethod(
				{
					iframe: true,
					token: tokenData.token,
				},
				callback,
			);
		},
		[iframeEnabled, loginMethod],
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
			const options = {
				beforeSend: (xhr: XMLHttpRequest) => {
					xhr.withCredentials = true;
				},
			};

			let url = iframeUrl;
			let separator = '?';
			if (url.indexOf('?') > -1) {
				separator = '&';
			}

			if (navigator.userAgent.indexOf('Electron') > -1) {
				url += `${separator}client=electron`;
			}

			const result = HTTP.call(apiMethod, apiUrl, options, (error, result) => {
				console.log(error, result);
				if (result?.data && (result.data.token || result.data.loginToken)) {
					loginWithToken(result.data, (error: Meteor.Error | Meteor.TypedError | Error | null | undefined) => {
						if (error) {
							setReactiveIframeUrl(url);
						} else {
							setReactiveIframeUrl(undefined);
						}
						callback?.(error, result);
					});
				} else {
					setReactiveIframeUrl(url);
				}
			});

			if (result?.data && (result.data.token || result.data.loginToken)) {
				loginWithToken(result.data);
			}
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
		const { _unstoreLoginToken } = Accounts;
		Accounts._unstoreLoginToken = function (...args) {
			tryLogin();
			_unstoreLoginToken.apply(Accounts, args);
		};
	}, [tryLogin]);

	return reactiveIframeUrl;
};

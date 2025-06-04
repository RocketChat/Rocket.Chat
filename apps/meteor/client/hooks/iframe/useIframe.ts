import { useLoginWithIframe, useLoginWithToken, useSetting } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

export const useIframe = () => {
	const [iframeLoginUrl, setIframeLoginUrl] = useState<string | undefined>(undefined);

	const iframeEnabled = useSetting('Accounts_iframe_enabled', false);
	const accountIframeUrl = useSetting('Accounts_iframe_url', '');
	const apiUrl = useSetting('Accounts_Iframe_api_url', '');
	const apiMethod = useSetting('Accounts_Iframe_api_method', '');

	const iframeLogin = useLoginWithIframe();
	const tokenLogin = useLoginWithToken();

	const loginWithToken = useCallback(
		(tokenData: string | { loginToken: string } | { token: string }, callback?: (error: Error | null | undefined) => void) => {
			if (typeof tokenData === 'string') {
				tokenData = {
					token: tokenData,
				};
			}
			if ('loginToken' in tokenData) {
				tokenLogin(tokenData.loginToken);
			}
			if ('token' in tokenData) {
				iframeLogin(tokenData.token, callback);
			}
		},
		[iframeLogin, tokenLogin],
	);

	const tryLogin = useCallback(
		async (callback?: (error: Error | null | undefined, result: unknown) => void) => {
			let url = accountIframeUrl;
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
				setIframeLoginUrl(url);
				callback?.(new Error(), null);
				return;
			}

			loginWithToken(await result.json(), async (error: Meteor.Error | Meteor.TypedError | Error | null | undefined) => {
				if (error) {
					setIframeLoginUrl(url);
				} else {
					setIframeLoginUrl(undefined);
				}
				callback?.(error, await result.json());
			});
		},
		[apiMethod, apiUrl, accountIframeUrl, loginWithToken],
	);

	return {
		enabled: Boolean(iframeEnabled && accountIframeUrl && apiUrl && apiMethod),
		tryLogin,
		loginWithToken,
		iframeLoginUrl,
	};
};

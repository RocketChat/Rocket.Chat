import type { UserStatus } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { type LocationPathname, UserContext, useLoginWithCustomOauth, useLoginWithToken, useSetting } from '@rocket.chat/ui-contexts';
import { useContext, useEffect } from 'react';

import { AccountBox } from '../../../../app/ui-utils/client/lib/AccountBox';
import { capitalize, ltrim, rtrim } from '../../../../lib/utils/stringUtils';
import { baseURI } from '../../../lib/baseURI';
import { loginServices } from '../../../lib/loginServices';
import { getRootUrlPathPrefix } from '../../../lib/meteorRuntimeConfig';
import { settings } from '../../../lib/settings';
import { router } from '../../../providers/RouterProvider';

export const useIframeCommands = () => {
	const iframeReceiveEnabled = useSetting('Iframe_Integration_receive_enable');
	const iframeReceiveOrigin = useSetting('Iframe_Integration_receive_origin', '*');
	const loginWithToken = useLoginWithToken();
	const loginWithCustomOauth = useLoginWithCustomOauth();
	const { logout } = useContext(UserContext);

	useEffect(() => {
		if (!iframeReceiveEnabled) {
			return;
		}

		const commands = {
			'go'(data: { path: string }) {
				if (typeof data.path !== 'string' || data.path.trim().length === 0) {
					return console.error('`path` not defined');
				}
				const newUrl = new URL(`${rtrim(baseURI, '/')}/${ltrim(data.path, '/')}`);

				const newParams = Array.from(newUrl.searchParams.entries()).reduce(
					(ret, [key, value]) => {
						ret[key] = value;
						return ret;
					},
					{} as Record<string, string>,
				);

				const newPath = newUrl.pathname.replace(new RegExp(`^${escapeRegExp(getRootUrlPathPrefix())}`), '') as LocationPathname;
				router.navigate({
					pathname: newPath,
					search: { ...router.getSearchParameters(), ...newParams },
				});
			},

			'set-user-status'(data: { status: UserStatus }) {
				AccountBox.setStatus(data.status);
			},

			'call-custom-oauth-login'(data: { service: string; redirectUrl?: string | null }, event: MessageEvent) {
				const customOAuthCallback = (response: unknown) => {
					event.source?.postMessage(
						{
							event: 'custom-oauth-callback',
							response,
						},
						{ targetOrigin: event.origin },
					);
				};

				const siteUrl = `${settings.peek('Site_Url') ?? ''}/`;
				if (typeof data.redirectUrl !== 'string' || !data.redirectUrl.startsWith(siteUrl)) {
					data.redirectUrl = null;
				}

				if (typeof data.service === 'string' && window.ServiceConfiguration) {
					const customOauth = loginServices.getLoginService(data.service);

					if (customOauth) {
						const customRedirectUri = data.redirectUrl || siteUrl;
						loginWithCustomOauth(capitalize(customOauth.service, true), { redirectUrl: customRedirectUri }, customOAuthCallback);
					}
				}
			},

			'login-with-token'(data: { token: string }) {
				if (typeof data.token === 'string') {
					void loginWithToken(data.token, () => {
						console.log('Iframe command [login-with-token]: result', data);
					});
				}
			},

			'logout'() {
				void logout();
				router.navigate('/home');
			},
		} as const;

		type CommandMessage<TCommandName extends keyof typeof commands = keyof typeof commands> = {
			externalCommand: TCommandName;
		} & Parameters<(typeof commands)[TCommandName]>[0];

		const messageListener = (event: MessageEvent<CommandMessage>) => {
			if (typeof event.data !== 'object' || typeof event.data.externalCommand !== 'string') {
				return;
			}

			if (iframeReceiveOrigin !== '*' && iframeReceiveOrigin.split(',').indexOf(event.origin) === -1) {
				console.error('Origin not allowed', event.origin);
				return;
			}

			if (!(event.data.externalCommand in commands)) {
				console.error('Command not allowed', event.data.externalCommand);
				return;
			}

			const command: (data: MessageEvent['data'], event: MessageEvent) => void = commands[event.data.externalCommand];
			command(event.data, event);
		};

		window.addEventListener('message', messageListener);

		return () => {
			window.removeEventListener('message', messageListener);
		};
	}, [iframeReceiveEnabled, iframeReceiveOrigin, loginWithToken, loginWithCustomOauth, logout]);
};

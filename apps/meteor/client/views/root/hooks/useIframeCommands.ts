import type { OAuthConfiguration, UserStatus } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/tools';
import { type LocationPathname, UserContext, useLoginWithToken, useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useContext, useEffect, useRef } from 'react';

import { ltrim, rtrim } from '../../../../lib/utils/stringUtils';
import { useLoginWithCustomOauth } from '../../../hooks/useLoginWithCustomOauth';
import { AccountBox } from '../../../lib/AccountBox';
import { baseURI } from '../../../lib/baseURI';
import { loginServices } from '../../../lib/loginServices';
import { getRootUrlPathPrefix } from '../../../lib/meteorRuntimeConfig';
import { router } from '../../../providers/RouterProvider';

export const useIframeCommands = () => {
	const iframeReceiveEnabled = useSetting('Iframe_Integration_receive_enable');
	const iframeReceiveOrigin = useSetting('Iframe_Integration_receive_origin', '*');
	const loginWithToken = useLoginWithToken();
	const loginWithCustomOauth = useLoginWithCustomOauth();
	const { logout } = useContext(UserContext);
	const userId = useUserId();
	const replyOnLoginRef = useRef<(() => void) | undefined>(undefined);

	useEffect(() => {
		if (!userId || !replyOnLoginRef.current) {
			return;
		}

		replyOnLoginRef.current();
		replyOnLoginRef.current = undefined;
	}, [userId]);

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

			'call-custom-oauth-login'(data: { service: string }, event: MessageEvent) {
				const replyToParent = (response?: Error) => {
					event.source?.postMessage({ event: 'custom-oauth-callback', response }, { targetOrigin: event.origin });
				};

				if (typeof data.service !== 'string' || data.service.trim().length === 0) {
					return console.error('`service` not defined');
				}

				loginServices
					.loadLoginService<OAuthConfiguration>(data.service)
					.then((config) => {
						if (!config) {
							replyToParent(new Error(`OAuth service not found: ${data.service}`));
							return;
						}
						const loginWindow = loginWithCustomOauth(data.service, { loginStyle: config.loginStyle });
						if (!loginWindow) {
							replyToParent(new Error('OAuth login popup was blocked'));
							return;
						}

						if (config.loginStyle === 'popup') {
							replyOnLoginRef.current = () => replyToParent();
						}
					})
					.catch(replyToParent);
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

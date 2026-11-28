import { escapeRegExp } from '@rocket.chat/tools';
import { type LocationPathname, useLoginWithToken } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { ltrim, rtrim } from '../../../../lib/utils/stringUtils';
import { baseURI } from '../../../lib/baseURI';
import { getRootUrlPathPrefix } from '../../../lib/meteorRuntimeConfig';
import { router } from '../../../providers/RouterProvider';

export const useOAuthPopupCommands = () => {
	const loginWithToken = useLoginWithToken();

	useEffect(() => {
		const commands = {
			//Used for the 2FA challenge and for handing the session over to the desktop/mobile clients.
			'redirect'(data: { path: string }) {
				if (typeof data.path !== 'string' || data.path.trim().length === 0) {
					return console.error('OAuth popup command [navigate]: `path` not defined');
				}

				const newUrl = new URL(`${rtrim(baseURI, '/')}/${ltrim(data.path, '/')}`);

				const newParams = Object.fromEntries(newUrl.searchParams.entries());

				const newPath = newUrl.pathname.replace(new RegExp(`^${escapeRegExp(getRootUrlPathPrefix())}`), '') as LocationPathname;

				router.navigate({
					pathname: newPath,
					search: { ...router.getSearchParameters(), ...newParams },
				});
			},

			'oauth-login-with-token'(data: { token: string }) {
				if (typeof data.token !== 'string') {
					return console.error('OAuth popup command [login]: `token` not defined');
				}

				void loginWithToken(data.token);
			},

			'login-error'(data: { oauthError: string }) {
				if (typeof data.oauthError !== 'string') {
					return console.error('OAuth popup command [login-error]: `oauthError` not defined');
				}

				router.navigate({
					pathname: router.getLocationPathname(),
					search: { ...router.getSearchParameters(), oauthError: data.oauthError },
				});
			},
		} as const;

		const runCommand = (data: unknown) => {
			if (typeof data !== 'object' || data === null) {
				return;
			}

			const { oauthPopupCommand } = data as { oauthPopupCommand?: unknown };

			if (typeof oauthPopupCommand !== 'string' || !Object.hasOwn(commands, oauthPopupCommand)) {
				return;
			}

			const command: (data: MessageEvent['data']) => void = commands[oauthPopupCommand as keyof typeof commands];
			command(data);
		};

		const messageListener = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) {
				return;
			}

			runCommand(event.data);
		};

		const channel = new BroadcastChannel('oauth-popup');
		channel.onmessage = (event) => runCommand(event.data);

		window.addEventListener('message', messageListener);

		return () => {
			window.removeEventListener('message', messageListener);
			channel.close();
		};
	}, [loginWithToken]);
};

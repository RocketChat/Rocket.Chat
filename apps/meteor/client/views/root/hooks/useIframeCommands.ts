import type { UserStatus, IUser } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { afterLogoutCleanUpCallback } from '@rocket.chat/ui-client';
import { type LocationPathname, useSetting } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { useEffect } from 'react';

import { AccountBox } from '../../../../app/ui-utils/client/lib/AccountBox';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { capitalize, ltrim, rtrim } from '../../../../lib/utils/stringUtils';
import { baseURI } from '../../../lib/baseURI';
import { loginServices } from '../../../lib/loginServices';
import { settings } from '../../../lib/settings';
import { getUser } from '../../../lib/user';
import { router } from '../../../providers/RouterProvider';

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

		const newPath = newUrl.pathname.replace(
			new RegExp(`^${escapeRegExp(__meteor_runtime_config__.ROOT_URL_PATH_PREFIX)}`),
			'',
		) as LocationPathname;
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
				const customLoginWith = (Meteor as any)[`loginWith${capitalize(customOauth.service, true)}`];
				const customRedirectUri = data.redirectUrl || siteUrl;
				customLoginWith.call(Meteor, { redirectUrl: customRedirectUri }, customOAuthCallback);
			}
		}
	},

	'login-with-token'(data: { token: string }) {
		if (typeof data.token === 'string') {
			Meteor.loginWithToken(data.token, () => {
				console.log('Iframe command [login-with-token]: result', data);
			});
		}
	},

	async 'logout'() {
		const user = getUser();
		Meteor.logout(() => {
			if (!user) return;

			void afterLogoutCleanUpCallback.run(user);
			sdk.call('logoutCleanUp', user as unknown as IUser);
			return router.navigate('/home');
		});
	},
} as const;

type CommandMessage<TCommandName extends keyof typeof commands = keyof typeof commands> = {
	externalCommand: TCommandName;
} & Parameters<(typeof commands)[TCommandName]>[0];

export const useIframeCommands = () => {
	const iframeReceiveEnabled = useSetting('Iframe_Integration_receive_enable');
	const iframeReceiveOrigin = useSetting('Iframe_Integration_receive_origin', '*');

	useEffect(() => {
		if (!iframeReceiveEnabled) {
			return;
		}
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
	}, [iframeReceiveEnabled, iframeReceiveOrigin]);
};

import type { UserStatus, IUser } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { LocationPathname } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { settings } from '../../app/settings/client';
import { AccountBox } from '../../app/ui-utils/client/lib/AccountBox';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { afterLogoutCleanUpCallback } from '../../lib/callbacks/afterLogoutCleanUpCallback';
import { capitalize, ltrim, rtrim } from '../../lib/utils/stringUtils';
import { baseURI } from '../lib/baseURI';
import { router } from '../providers/RouterProvider';

const commands = {
	'go'(data: { path: string }) {
		if (typeof data.path !== 'string' || data.path.trim().length === 0) {
			return console.error('`path` not defined');
		}
		const newUrl = new URL(`${rtrim(baseURI, '/')}/${ltrim(data.path, '/')}`);

		const newParams = Array.from(newUrl.searchParams.entries()).reduce((ret, [key, value]) => {
			ret[key] = value;
			return ret;
		}, {} as Record<string, string>);

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

		const siteUrl = `${Meteor.settings.Site_Url}/`;
		if (typeof data.redirectUrl !== 'string' || !data.redirectUrl.startsWith(siteUrl)) {
			data.redirectUrl = null;
		}

		if (typeof data.service === 'string' && window.ServiceConfiguration) {
			const customOauth = ServiceConfiguration.configurations.findOne({ service: data.service });

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
		const user = Meteor.user();
		Meteor.logout(() => {
			if (!user) {
				return;
			}
			void afterLogoutCleanUpCallback.run(user);
			sdk.call('logoutCleanUp', user as unknown as IUser);
			return router.navigate('/home');
		});
	},
} as const;

type CommandMessage<TCommandName extends keyof typeof commands = keyof typeof commands> = {
	externalCommand: TCommandName;
} & Parameters<(typeof commands)[TCommandName]>[0];

window.addEventListener('message', <TCommandMessage extends CommandMessage>(e: MessageEvent<TCommandMessage>) => {
	if (!settings.get<boolean>('Iframe_Integration_receive_enable')) {
		return;
	}

	if (typeof e.data !== 'object' || typeof e.data.externalCommand !== 'string') {
		return;
	}

	const origins = settings.get<string>('Iframe_Integration_receive_origin');

	if (origins !== '*' && origins.split(',').indexOf(e.origin) === -1) {
		console.error('Origin not allowed', e.origin);
		return;
	}

	if (!(e.data.externalCommand in commands)) {
		console.error('Command not allowed', e.data.externalCommand);
		return;
	}

	const command: (data: any, event: MessageEvent) => void = commands[e.data.externalCommand];
	command(e.data, e);
});

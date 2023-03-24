import type { UserStatus } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { settings } from '../../app/settings/client';
import { AccountBox } from '../../app/ui-utils/client';
import { callbacks } from '../../lib/callbacks';
import { capitalize, ltrim, rtrim } from '../../lib/utils/stringUtils';
import { baseURI } from '../lib/baseURI';
import { add, remove } from '../views/room/lib/Toolbox/IframeButtons';

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

		const newPath = newUrl.pathname.replace(new RegExp(`^${escapeRegExp(__meteor_runtime_config__.ROOT_URL_PATH_PREFIX)}`), '');
		FlowRouter.go(newPath, undefined, { ...FlowRouter.current().queryParams, ...newParams });
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

	'login-with-token'(data: { token: string }, ...args: unknown[]) {
		if (typeof data.token === 'string') {
			Meteor.loginWithToken(data.token, () => {
				console.log('Iframe command [login-with-token]: result', [data, ...args]);
			});
		}
	},

	async 'logout'() {
		const user = await Meteor.userAsync();
		Meteor.logout(() => {
			callbacks.run('afterLogoutCleanUp', user);
			Meteor.call('logoutCleanUp', user);
			return FlowRouter.go('home');
		});
	},

	'set-toolbar-button'({ id, icon, label }: { id: string; icon: string; label: string }) {
		add(id, { id, icon, label });
	},
	'remove-toolbar-button'({ id }: { id: string }) {
		remove(id);
	},
} as const;

window.addEventListener('message', <TCommand extends keyof typeof commands>(e: MessageEvent<{ externalCommand: TCommand }>) => {
	if (settings.get('Iframe_Integration_receive_enable') !== true) {
		return;
	}

	if (typeof e.data !== 'object' || typeof e.data.externalCommand !== 'string') {
		return;
	}

	const origins = settings.get('Iframe_Integration_receive_origin');

	if (origins !== '*' && origins.split(',').indexOf(e.origin) === -1) {
		return console.error('Origin not allowed', e.origin);
	}

	const command = commands[e.data.externalCommand];
	if (command) {
		command(e.data as any, e);
	}
});

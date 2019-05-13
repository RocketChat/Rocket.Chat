import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { ServiceConfiguration } from 'meteor/service-configuration';
import s from 'underscore.string';

import { AccountBox } from '../../../ui-utils';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';

const commands = {
	go(data) {
		if (typeof data.path !== 'string' || data.path.trim().length === 0) {
			return console.error('`path` not defined');
		}
		FlowRouter.go(data.path, null, FlowRouter.current().queryParams);
	},


	'set-user-status'(data) {
		AccountBox.setStatus(data.status);
	},

	'call-custom-oauth-login'(data, event) {
		const customOAuthCallback = (response) => {
			event.source.postMessage({
				event: 'custom-oauth-callback',
				response,
			}, event.origin);
		};

		const siteUrl = `${ Meteor.settings.Site_Url }/`;
		if (typeof data.redirectUrl !== 'string' || !data.redirectUrl.startsWith(siteUrl)) {
			data.redirectUrl = null;
		}

		if (typeof data.service === 'string' && window.ServiceConfiguration) {
			const customOauth = ServiceConfiguration.configurations.findOne({ service: data.service });

			if (customOauth) {
				const customLoginWith = Meteor[`loginWith${ s.capitalize(customOauth.service, true) }`];
				const customRedirectUri = data.redirectUrl || siteUrl;
				customLoginWith.call(Meteor, { redirectUrl: customRedirectUri }, customOAuthCallback);
			}
		}
	},

	'login-with-token'(data, ...args) {
		if (typeof data.token === 'string') {
			Meteor.loginWithToken(data.token, function() {
				console.log('Iframe command [login-with-token]: result', [data, ...args]);
			});
		}
	},

	'logout'() {
		const user = Meteor.user();
		Meteor.logout(() => {
			callbacks.run('afterLogoutCleanUp', user);
			Meteor.call('logoutCleanUp', user);
			return FlowRouter.go('home');
		});
	},

	'set-toolbar-button'({ id, icon, label: i18nTitle }) {
		const toolbar = Session.get('toolbarButtons') || { buttons: {} };
		toolbar.buttons[id] = { icon, i18nTitle };
		Session.set('toolbarButtons', toolbar);
	},

	'remove-toolbar-button'({ id }) {
		const toolbar = Session.get('toolbarButtons') || { buttons: {} };
		delete toolbar.buttons[id];
		Session.set('toolbarButtons', toolbar);
	},
};

window.addEventListener('message', (e) => {
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
		command(e.data, e);
	}
});

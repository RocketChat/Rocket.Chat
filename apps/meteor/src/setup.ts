// eslint-disable-next-line spaced-comment
/// <reference types="vite/client" />

import { Accounts } from '@rocket.chat/meteor-client/accounts-base';
import { registerService, serviceNames, unregisterService } from '@rocket.chat/meteor-client/accounts-oauth';
import { loginWithPassword, _hashPassword } from '@rocket.chat/meteor-client/accounts-password';
import { Meteor } from '@rocket.chat/meteor-client/meteor';

import { e2e } from '../client/lib/e2ee/rocketchat.e2e.ts';

import '@rocket.chat/meteor-client/service-configuration';

import '../app/theme/client/main.css';

/**
 * Used in E2E tests
 */
const require = (text: string) => {
	switch (text) {
		case '/client/lib/e2ee/rocketchat.e2e.ts':
			return { e2e };
		case 'meteor/accounts-base':
			return { Accounts };
		default:
			throw new Error(`Module not found: ${text}`);
	}
};

Object.assign(globalThis, { require });

Object.assign(Accounts, { _hashPassword }, { oauth: { registerService, serviceNames, unregisterService } });
Object.assign(Meteor, {
	loginWithPassword,
	loggingIn: Accounts.loggingIn.bind(Accounts),
	logout: Accounts.logout.bind(Accounts),
	loginWithToken: Accounts.loginWithToken.bind(Accounts),
});

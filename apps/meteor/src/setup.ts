import { Accounts } from './meteor/accounts-base.ts';
import { registerService, serviceNames, unregisterService } from './meteor/accounts-oauth.ts';
import { loginWithPassword, _hashPassword } from './meteor/accounts-password.ts';
import { Meteor } from './meteor/meteor.ts';
import { e2e } from '../client/lib/e2ee/rocketchat.e2e.ts';

import './meteor/service-configuration.ts';

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

Object.assign(globalThis, { process: {} });

Object.assign(Accounts, { _hashPassword }, { oauth: { registerService, serviceNames, unregisterService } });
Object.assign(Meteor, {
	loginWithPassword,
	loggingIn: Accounts.loggingIn.bind(Accounts),
	logout: Accounts.logout.bind(Accounts),
	loginWithToken: Accounts.loginWithToken.bind(Accounts),
});

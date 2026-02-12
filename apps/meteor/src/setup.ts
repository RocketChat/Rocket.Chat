import { Accounts } from './meteor/accounts-base.ts';
import { registerService, serviceNames, unregisterService } from './meteor/accounts-oauth.ts';
import { loginWithPassword, _hashPassword } from './meteor/accounts-password.ts';
import { Meteor } from './meteor/meteor.ts';

import './meteor/service-configuration.ts';

import '../app/theme/client/main.css';

Object.assign(globalThis, { process: {} });

Object.assign(Accounts, { _hashPassword }, { oauth: { registerService, serviceNames, unregisterService } });
Object.assign(Meteor, {
	loginWithPassword,
	loggingIn: Accounts.loggingIn.bind(Accounts),
	logout: Accounts.logout.bind(Accounts),
	loginWithToken: Accounts.loginWithToken.bind(Accounts),
});

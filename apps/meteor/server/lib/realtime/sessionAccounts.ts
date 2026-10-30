import { hashLoginToken } from '@rocket.chat/account-utils';
import type { LoginResult, SessionAccounts } from '@rocket.chat/ddp-server';

import { callMeteorMethod } from './meteorMethods';

/**
 * Logs sessions in and out through Meteor's own `login` and `logout` methods, so every Accounts hook still runs.
 */
export const sessionAccounts: SessionAccounts = {
	async login(session, params) {
		const result = (await callMeteorMethod(session, 'login', params)) as LoginResult;
		return { result, hashedToken: hashLoginToken(result.token) };
	},
	async logout(session) {
		await callMeteorMethod(session, 'logout', []);
	},
};

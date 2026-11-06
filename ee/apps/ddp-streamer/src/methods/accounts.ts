import { Account, ClientSafeError } from '@rocket.chat/core-services';
import type { SessionAccounts } from '@rocket.chat/ddp-server';

/** Logs sessions in and out through the Account service. */
export const sessionAccounts: SessionAccounts = {
	async login(_session, params) {
		const [{ resume }] = params as [{ resume: string }];
		const result = await Account.login({ resume });
		if (!result) {
			throw new ClientSafeError(403, "You've been logged out by the server. Please log in again");
		}

		return {
			result: {
				id: result.uid,
				token: result.token,
				tokenExpires: result.tokenExpires,
				type: result.type,
			},
			hashedToken: result.hashedToken,
		};
	},
	async logout({ userId, userToken }) {
		if (userToken && userId) {
			await Account.logout({ userId, token: userToken });
		}
	},
};

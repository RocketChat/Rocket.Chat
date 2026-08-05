import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';

import { SystemLogger } from '../../lib/logger/system';
import { settings } from '../../settings';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		sendForgotPasswordEmail(to: string): boolean | undefined;
	}
}

export const sendForgotPasswordEmail = async (to: string): Promise<boolean | undefined> => {
	const email = to.trim().toLowerCase();

	const user = await Users.findOneByEmailAddress(email, { projection: { _id: 1, services: 1 } });

	if (!user) {
		return true;
	}

	if (user.services && !user.services.password) {
		if (!settings.get('Accounts_AllowPasswordChangeForOAuthUsers')) {
			return false;
		}
	}

	try {
		Accounts.sendResetPasswordEmail(user._id, email);
		return true;
	} catch (err) {
		SystemLogger.error({ err });
	}
};

Meteor.methods<ServerMethods>({
	async sendForgotPasswordEmail(to) {
		check(to, String);

		return sendForgotPasswordEmail(to);
	},
});

// This method is unauthenticated (callable over DDP and via method.callAnon), so we key the
// rate limit on `clientAddress` rather than `userId` — keying on the (always-null) anonymous
// userId would collapse every caller into a single global bucket. Correct per-client bucketing
// relies on `HTTP_FORWARDED_COUNT` being set to the real number of trusted proxies, the same
// assumption the generic DDP IP rate limit and login-attempt throttling already depend on.
// The 10/60s allowance mirrors the REST `users.forgotPassword` endpoint (which inherits the
// API_Enable_Rate_Limiter_Limit_Calls_Default / _Time_Default defaults) so the same operation
// has the same per-client allowance regardless of the path it is called through.
DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'sendForgotPasswordEmail',
		clientAddress() {
			return true;
		},
	},
	10,
	60000,
);

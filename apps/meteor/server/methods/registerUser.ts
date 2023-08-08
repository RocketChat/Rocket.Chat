import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Accounts } from 'meteor/accounts-base';
import { Match, check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';

import { validateInviteToken } from '../../app/invites/server/functions/validateInviteToken';
import { validateEmailDomain, passwordPolicy, RateLimiter } from '../../app/lib/server';
import { settings } from '../../app/settings/server';
import { trim } from '../../lib/utils/stringUtils';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		registerUser(
			formData:
				| { email: string; pass: string; username: IUser['username']; name: string; secretURL?: string; reason?: string }
				| { email?: null },
		):
			| {
					token: string;
					when: Date;
			  }
			| string;
	}
}

Meteor.methods<ServerMethods>({
	async registerUser(formData) {
		const AllowAnonymousRead = settings.get<boolean>('Accounts_AllowAnonymousRead');
		const AllowAnonymousWrite = settings.get<boolean>('Accounts_AllowAnonymousWrite');
		const manuallyApproveNewUsers = settings.get<boolean>('Accounts_ManuallyApproveNewUsers');
		if (AllowAnonymousRead === true && AllowAnonymousWrite === true && !formData.email) {
			const userId = Accounts.insertUserDoc(
				{},
				{
					globalRoles: ['anonymous'],
					active: true,
				},
			);

			const stampedLoginToken = Accounts._generateStampedLoginToken();

			Accounts._insertLoginToken(userId, stampedLoginToken);
			return stampedLoginToken;
		}
		check(
			formData,
			Match.ObjectIncluding({
				email: String,
				pass: String,
				name: String,
				secretURL: Match.Optional(String),
				reason: Match.Optional(String),
			}),
		);

		if (settings.get('Accounts_RegistrationForm') === 'Disabled') {
			throw new Meteor.Error('error-user-registration-disabled', 'User registration is disabled', {
				method: 'registerUser',
			});
		}

		if (
			settings.get('Accounts_RegistrationForm') === 'Secret URL' &&
			(!formData.secretURL || formData.secretURL !== settings.get('Accounts_RegistrationForm_SecretURL'))
		) {
			if (!formData.secretURL) {
				throw new Meteor.Error('error-user-registration-secret', 'User registration is only allowed via Secret URL', {
					method: 'registerUser',
				});
			}

			try {
				await validateInviteToken(formData.secretURL);
			} catch (e) {
				throw new Meteor.Error('error-user-registration-secret', 'User registration is only allowed via Secret URL', {
					method: 'registerUser',
				});
			}
		}	

		await validateEmailDomain(formData.email);

		const userData = {
			email: trim(formData.email.toLowerCase()),
			password: formData.pass,
			name: formData.name,
			reason: formData.reason,
		};

		let userId;
		try {
			// Check if user has already been imported and never logged in. If so, set password and let it through
			const importedUser = await Users.findOneByEmailAddress(formData.email);

			if (importedUser?.importIds?.length && !importedUser.lastLogin) {
				await Accounts.setPasswordAsync(importedUser._id, userData.password);
				userId = importedUser._id;
			} else {
				userId = await Accounts.createUserAsync(userData);
			}
		} catch (e) {
			if (e instanceof Meteor.Error) {
				throw e;
			}

			if (e instanceof Error) {
				throw new Meteor.Error(e.message);
			}

			throw new Meteor.Error(String(e));
		}

		await Users.setName(userId, trim(formData.name));

		const reason = trim(formData.reason);
		if (manuallyApproveNewUsers && reason) {
			await Users.setReason(userId, reason);
		}

		try {
			Accounts.sendVerificationEmail(userId, userData.email);
		} catch (error) {
			// throw new Meteor.Error 'error-email-send-failed', 'Error trying to send email: ' + error.message, { method: 'registerUser', message: error.message }
		}

		return userId;
	},
});

let registerUserRuleId = RateLimiter.limitMethod(
	'registerUser',
	settings.get('Rate_Limiter_Limit_RegisterUser'),
	settings.get('API_Enable_Rate_Limiter_Limit_Time_Default'),
	{
		userId() {
			return true;
		},
	},
);

settings.watch('Rate_Limiter_Limit_RegisterUser', (value) => {
	// When running on testMode, there's no rate limiting added, so this function throws an error
	if (process.env.TEST_MODE === 'true') {
		return;
	}

	if (!registerUserRuleId) {
		throw new Error('Rate limiter rule for "registerUser" not found');
	}
	// remove old DDP rate limiter rule and create a new one with the updated setting value
	DDPRateLimiter.removeRule(registerUserRuleId);
	registerUserRuleId = RateLimiter.limitMethod('registerUser', value, settings.get('API_Enable_Rate_Limiter_Limit_Time_Default'), {
		userId() {
			return true;
		},
	});
});

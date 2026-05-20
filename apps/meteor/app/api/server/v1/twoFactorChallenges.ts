import type { IMethodConnection } from '@rocket.chat/core-typings';
import { TwoFactorChallenges } from '@rocket.chat/models';
import { isTwoFactorChallengesSendEmailCodeParamsPOST, isTwoFactorChallengesVerifyChallengeParamsPOST } from '@rocket.chat/rest-typings';
import { Accounts } from 'meteor/accounts-base';

import { emailCheckForOAuth, getTwoFAMethodForOAuth } from '../../../../server/lib/oauth/twoFactorAuth';
import { getUserForCheck, rememberAuthorizationByToken } from '../../../2fa/server/code';
import { generateConnection } from '../ApiClass';
import { API } from '../api';

API.v1.addRoute(
	'twoFactorChallenges.sendEmailCode',
	{ validateParams: isTwoFactorChallengesSendEmailCodeParamsPOST, rateLimiterOptions: { intervalTimeInMS: 60000, numRequestsAllowed: 5 } },
	{
		async post() {
			const { challengeId } = this.bodyParams;

			if (!challengeId) {
				throw new Meteor.Error('error-parameter-required', 'challengeId is required');
			}

			const challenge = await TwoFactorChallenges.findOneByPendingChallengeId(challengeId);

			if (!challenge) {
				throw new Meteor.Error('error-challenge-not-found', 'challenge not found');
			}

			if (challenge.expireAt && challenge.expireAt < new Date()) {
				throw new Meteor.Error('error-challenge-expired', 'challenge expired');
			}

			if (challenge.method !== 'email') {
				throw new Meteor.Error('error-invalid-challenge-method', 'invalid challenge method');
			}

			const { userId } = challenge;

			const user = await getUserForCheck(userId);

			if (!user) {
				throw new Meteor.Error('error-user-not-found', 'user not found');
			}

			await emailCheckForOAuth.sendEmailCode(user);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'twoFactorChallenges.verifyChallenge',
	{
		validateParams: isTwoFactorChallengesVerifyChallengeParamsPOST,
		rateLimiterOptions: { intervalTimeInMS: 60000, numRequestsAllowed: 5 },
	},
	{
		async post() {
			const { challengeId, code } = this.bodyParams;

			if (!challengeId || !code) {
				throw new Meteor.Error('error-parameter-required', 'challengeId and code are required');
			}

			const challenge = await TwoFactorChallenges.findOneByPendingChallengeId(challengeId);

			if (!challenge) {
				throw new Meteor.Error('error-challenge-not-found', 'challenge not found');
			}

			const { userId } = challenge;

			const user = await getUserForCheck(userId);

			if (!user) {
				throw new Meteor.Error('error-user-not-found', 'user not found');
			}

			const twoFAMethod = getTwoFAMethodForOAuth(challenge.method);

			const isCodeValid = await twoFAMethod.verifyEmailTwoFactorChallenge(user, challengeId, code);

			if (!isCodeValid) {
				const tooManyAttempts = await twoFAMethod.maxFaildedAttemtpsReached(user);
				if (tooManyAttempts) {
					await TwoFactorChallenges.removeByPendingChallengeId(challengeId);
					throw new Meteor.Error('totp-max-attempts', 'TOTP Maximun Failed Attempts Reached');
				}
				return API.v1.failure('error-invalid-code', 'Invalid code');
			}

			const stampedToken = Accounts._generateStampedLoginToken();

			await Accounts._insertLoginToken(user._id, stampedToken);

			const hashedToken = Accounts._hashLoginToken(stampedToken.token);

			const connection = {
				...generateConnection(this.requestIp, this.request.headers),
				token: hashedToken,
			} as unknown as IMethodConnection;

			// remember the 2FA authorization for the next requests
			await rememberAuthorizationByToken(hashedToken, user._id, connection);

			return API.v1.success({
				loginToken: stampedToken.token,
				userId: user._id,
			});
		},
	},
);

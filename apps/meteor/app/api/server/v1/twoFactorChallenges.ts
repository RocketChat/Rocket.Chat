import { TwoFactorChallenges } from '@rocket.chat/models';
import { isTwoFactorChallengesSendEmailCodeParamsPOST, isTwoFactorChallengesVerifyChallengeParamsPOST } from '@rocket.chat/rest-typings';
import { Accounts } from 'meteor/accounts-base';

import { emailCheckForOAuth, getTwoFAMethodForOAuth } from '../../../../server/lib/oauth/twoFactorAuth';
import { getUserForCheck } from '../../../2fa/server/code';
import { API } from '../api';

API.v1.addRoute(
	'twoFactorChallenges.sendEmailCode',
	{ validateParams: isTwoFactorChallengesSendEmailCodeParamsPOST },
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
	{ validateParams: isTwoFactorChallengesVerifyChallengeParamsPOST },
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

			const isCodeValid = await twoFAMethod.verify(user, code);

			if (!isCodeValid) {
				return API.v1.failure('error-invalid-code', 'Invalid code');
			}

			const stampedToken = Accounts._generateStampedLoginToken();
			Accounts._insertLoginToken(user._id, stampedToken);

			return API.v1.success({
				loginToken: stampedToken.token,
			});
		},
	},
);

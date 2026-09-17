import { ajv } from './Ajv';

type TwoFactorChallengesSendEmailCode = { challengeId: string };

const TwoFactorChallengesSendEmailCodeSchema = {
	type: 'object',
	properties: {
		challengeId: {
			type: 'string',
		},
	},
	required: ['challengeId'],
	additionalProperties: false,
};

export const isTwoFactorChallengesSendEmailCodeParamsPOST = ajv.compile<TwoFactorChallengesSendEmailCode>(
	TwoFactorChallengesSendEmailCodeSchema,
);

type TwoFactorChallengesVerifyChallenge = { challengeId: string; code: string };

const TwoFactorChallengesVerifyChallengeSchema = {
	type: 'object',
	properties: {
		challengeId: { type: 'string' },
		code: { type: 'string' },
	},
	required: ['challengeId', 'code'],
	additionalProperties: false,
};

export const isTwoFactorChallengesVerifyChallengeParamsPOST = ajv.compile<TwoFactorChallengesVerifyChallenge>(
	TwoFactorChallengesVerifyChallengeSchema,
);

export type TwoFactorChallengesEndpoints = {
	'/v1/twoFactorChallenges.sendEmailCode': {
		POST: (params: TwoFactorChallengesSendEmailCode) => void;
	};
	'/v1/twoFactorChallenges.verifyChallenge': {
		POST: (params: TwoFactorChallengesVerifyChallenge) => { loginToken: string; userId: string };
	};
};

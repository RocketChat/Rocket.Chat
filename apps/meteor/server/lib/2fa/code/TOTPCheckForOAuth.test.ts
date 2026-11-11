import { after, before, beforeEach, describe, it } from 'node:test';

import type { ITwoFactorChallengesModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';
import speakeasy from 'speakeasy';

import { createFakeUser } from '../../../../tests/mocks/data';

const sandbox = sinon.createSandbox();

const settings = { get: (key: string) => key === 'Accounts_TwoFactorAuthentication_By_TOTP_Enabled' };

const { TOTP } = p.noCallThru().load('../lib/totp.ts', { '../../../settings': { settings } });
const { TOTPCheck } = p.noCallThru().load('./TOTPCheck.ts', { '../../../settings': { settings }, '../lib/totp': { TOTP } });
const { TOTPCheckForOAuth } = p.noCallThru().load('./TOTPCheckForOAuth.ts', { './TOTPCheck': { TOTPCheck } });

const TwoFactorChallenges = {
	findOneByPendingChallengeId: sandbox.stub(),
	removeByPendingChallengeId: sandbox.stub(),
};

const secret = speakeasy.generateSecret().base32;
const user = createFakeUser({ services: { totp: { enabled: true, secret, hashedBackup: [] } } });
const currentCode = () => speakeasy.totp({ secret, encoding: 'base32' });

describe('TOTPCheckForOAuth.verifyEmailTwoFactorChallenge', () => {
	const check = new TOTPCheckForOAuth();
	let clock: sinon.SinonFakeTimers;

	before(() => {
		clock = sinon.useFakeTimers({ now: new Date('2026-11-04T10:00:10.000Z'), toFake: ['Date'] });
		registerModel('ITwoFactorChallengesModel', TwoFactorChallenges as unknown as ITwoFactorChallengesModel);
	});

	after(() => {
		clock.restore();
	});

	beforeEach(() => {
		sandbox.resetHistory();
		TwoFactorChallenges.findOneByPendingChallengeId.resolves({ _id: 'challenge-id', expireAt: new Date(Date.now() + 60_000) });
	});

	it('should accept the current code once and consume the challenge', async () => {
		expect(await check.verifyEmailTwoFactorChallenge(user, 'challenge-id', currentCode())).to.be.true;
		expect(TwoFactorChallenges.removeByPendingChallengeId.calledOnceWith('challenge-id')).to.be.true;
	});

	it('should refuse a wrong code and keep the challenge open for another try', async () => {
		const wrongCode = String((Number(currentCode()) + 500_000) % 1_000_000).padStart(6, '0');

		expect(await check.verifyEmailTwoFactorChallenge(user, 'challenge-id', wrongCode)).to.be.false;
		expect(TwoFactorChallenges.removeByPendingChallengeId.called).to.be.false;
	});

	it('should refuse an expired challenge even with the current code', async () => {
		TwoFactorChallenges.findOneByPendingChallengeId.resolves({ _id: 'challenge-id', expireAt: new Date(Date.now() - 1) });

		await expect(check.verifyEmailTwoFactorChallenge(user, 'challenge-id', currentCode())).to.be.rejectedWith('challenge expired');
		expect(TwoFactorChallenges.removeByPendingChallengeId.called).to.be.false;
	});

	it('should refuse a challenge that is not pending', async () => {
		TwoFactorChallenges.findOneByPendingChallengeId.resolves(null);

		expect(await check.verifyEmailTwoFactorChallenge(user, 'challenge-id', currentCode())).to.be.false;
	});

	it('should refuse the code of a user who turned TOTP off', async () => {
		const withoutTotp = createFakeUser({ services: { totp: { enabled: false, secret, hashedBackup: [] } } });

		expect(await check.verifyEmailTwoFactorChallenge(withoutTotp, 'challenge-id', currentCode())).to.be.false;
		expect(TwoFactorChallenges.removeByPendingChallengeId.called).to.be.false;
	});
});

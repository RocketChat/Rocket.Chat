import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { SHA256 } from '@rocket.chat/sha256';
import { expect } from 'chai';
import sinon from 'sinon';
import speakeasy from 'speakeasy';

const settingsGet = sinon.stub();
const update2FABackupCodesByUserId = sinon.stub();

let TOTP: typeof import('./totp').TOTP;

before(async () => {
	mock.module('../../../settings', { exports: { settings: { get: settingsGet } } });
	({ TOTP } = await import('./totp'));
});

describe('TOTP.verify', () => {
	const { base32: secret } = speakeasy.generateSecret();
	const codeAt = (time: number) => speakeasy.totp({ secret, encoding: 'base32', time });
	const now = () => Math.floor(Date.now() / 1000);

	beforeEach(() => {
		update2FABackupCodesByUserId.reset();
		mockModel('Users', { update2FABackupCodesByUserId });
	});

	it('should accept a backup code once and remove it from the user backup codes', async () => {
		const backupTokens = [SHA256('aaaa1111'), SHA256('bbbb2222')];

		expect(await TOTP.verify({ secret, token: 'bbbb2222', backupTokens, userId: 'user-id' })).to.be.true;
		expect(update2FABackupCodesByUserId.calledOnceWith('user-id', [SHA256('aaaa1111')])).to.be.true;

		const [, storedCodes] = update2FABackupCodesByUserId.lastCall.args;
		expect(await TOTP.verify({ secret, token: 'bbbb2222', backupTokens: storedCodes, userId: 'user-id' })).to.be.false;
	});

	it('should refuse a backup code that is not one of the user backup codes', async () => {
		expect(await TOTP.verify({ secret, token: 'cccc3333', backupTokens: [SHA256('aaaa1111')], userId: 'user-id' })).to.be.false;
		expect(update2FABackupCodesByUserId.called).to.be.false;
	});

	it('should accept the current code from the authenticator', async () => {
		expect(await TOTP.verify({ secret, token: codeAt(now()) })).to.be.true;
	});

	it('should refuse a code from a few minutes ago when no time window is set', async () => {
		expect(await TOTP.verify({ secret, token: codeAt(now() - 120) })).to.be.false;
	});

	it('should accept a code from a few minutes ago within the configured time window', async () => {
		settingsGet.withArgs('Accounts_TwoFactorAuthentication_MaxDelta').returns(5);

		expect(await TOTP.verify({ secret, token: codeAt(now() - 120) })).to.be.true;
		expect(await TOTP.verify({ secret, token: codeAt(now() - 600) })).to.be.false;
	});
});

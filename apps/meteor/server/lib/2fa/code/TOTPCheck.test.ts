import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsGet = sinon.stub();
const verify = sinon.stub();

const { TOTPCheck } = proxyquire.noCallThru().load('./TOTPCheck', {
	'../../../settings': { settings: { get: settingsGet } },
	'../lib/totp': { TOTP: { verify } },
});

const hashedBackup = ['hashed-backup-code'];

const buildUser = (totp: Record<string, unknown> = { enabled: true, secret: 'secret', hashedBackup }) => ({
	_id: 'user-id',
	services: { totp },
});

describe('TOTPCheck', () => {
	beforeEach(() => {
		settingsGet.reset();
		settingsGet.withArgs('Accounts_TwoFactorAuthentication_By_TOTP_Enabled').returns(true);
		verify.reset();
		verify.resolves(true);
	});

	it('should accept a code the authenticator validates, including the user backup codes', async () => {
		expect(await new TOTPCheck().verify(buildUser(), '123456')).to.be.true;
		expect(verify.calledOnceWith(sinon.match({ secret: 'secret', token: '123456', userId: 'user-id', backupTokens: hashedBackup }))).to.be
			.true;
	});

	it('should refuse a code the authenticator rejects', async () => {
		verify.resolves(false);

		expect(await new TOTPCheck().verify(buildUser(), '123456')).to.be.false;
	});

	it('should refuse a valid code once an admin turns TOTP off for the server', async () => {
		settingsGet.withArgs('Accounts_TwoFactorAuthentication_By_TOTP_Enabled').returns(false);

		expect(await new TOTPCheck().verify(buildUser(), '123456')).to.be.false;
		expect(verify.called).to.be.false;
	});

	it('should refuse a code for a user who turned TOTP off', async () => {
		const user = buildUser({ enabled: false, secret: 'secret' });

		expect(await new TOTPCheck().verify(user, '123456')).to.be.false;
		expect(verify.called).to.be.false;
	});

	it('should refuse a code for a user with no secret', async () => {
		expect(await new TOTPCheck().verify(buildUser({ enabled: true }), '123456')).to.be.false;
		expect(verify.called).to.be.false;
	});

	it('should treat a user with no services as not enrolled', async () => {
		const user = { _id: 'sso-user-id' };

		expect(new TOTPCheck().isEnabled(user)).to.be.false;
		expect(await new TOTPCheck().verify(user, '123456')).to.be.false;
	});

	it('should answer to the totp method, send nothing after a wrong code and leave limits to the rate limiter', async () => {
		const check = new TOTPCheck();

		expect(check.name).to.equal('totp');
		expect(await check.processInvalidCode()).to.deep.equal({ codeGenerated: false });
		expect(await check.maxFaildedAttemtpsReached()).to.be.false;
	});
});

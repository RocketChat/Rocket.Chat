import { beforeEach, describe, it } from 'node:test';

import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import type { ILoginAttempt } from './ILoginAttempt';

const isValidLoginAttemptByIp = sinon.stub();
const isValidAttemptByUser = sinon.stub();
const settingsGet = sinon.stub();
const callbacksRun = sinon.stub();
const updateLastLoginById = sinon.stub();
const triggerEvent = sinon.stub();

const { validateLoginAttempt } = proxyquire.noCallThru().load('./validateLoginAttempt', {
	'@rocket.chat/apps': {
		Apps: { self: { triggerEvent } },
		AppEvents: { IPostUserLoggedIn: 'IPostUserLoggedIn' },
	},
	'@rocket.chat/models': { Users: { updateLastLoginById } },
	'./restrictLoginAttempts': { isValidLoginAttemptByIp, isValidAttemptByUser },
	'../../settings': { settings: { get: settingsGet } },
	'../callbacks': { callbacks: { run: callbacksRun } },
	'../getClientAddress': { getClientAddress: () => '10.0.0.1' },
});

const createUser = (overrides: Partial<IUser> = {}): IUser =>
	({
		_id: 'user-id',
		username: 'jane',
		type: 'user',
		active: true,
		roles: ['user'],
		emails: [{ address: 'jane@example.com', verified: false }],
		...overrides,
	}) as IUser;

const createAttempt = (overrides: Partial<ILoginAttempt> = {}): ILoginAttempt => ({
	type: 'password',
	allowed: true,
	methodName: 'login',
	methodArguments: [],
	connection: { id: 'connection-id', clientAddress: '10.0.0.1', httpHeaders: {}, close: () => undefined, onClose: () => undefined },
	user: createUser(),
	...overrides,
});

describe('validateLoginAttempt', () => {
	beforeEach(() => {
		isValidLoginAttemptByIp.reset();
		isValidLoginAttemptByIp.resolves(true);
		isValidAttemptByUser.reset();
		isValidAttemptByUser.resolves(true);
		settingsGet.reset();
		callbacksRun.reset();
		callbacksRun.callsFake(async (_hook: string, item: unknown) => item);
		updateLastLoginById.reset();
		triggerEvent.reset();
	});

	it('refuses an address that is blocked after too many failed attempts', async () => {
		isValidLoginAttemptByIp.resolves(false);

		await expect(validateLoginAttempt(createAttempt())).to.be.rejectedWith('error-login-blocked-for-ip');
	});

	it('refuses a user that is blocked after too many failed attempts', async () => {
		isValidAttemptByUser.resolves(false);

		await expect(validateLoginAttempt(createAttempt())).to.be.rejectedWith('error-login-blocked-for-user');
	});

	it('keeps the refusal of the method that authenticated the attempt', async () => {
		expect(await validateLoginAttempt(createAttempt({ allowed: false }))).to.equal(false);
		expect(updateLastLoginById.called).to.equal(false);
	});

	it('refuses app users, deactivated users and users without roles', async () => {
		await expect(validateLoginAttempt(createAttempt({ user: createUser({ type: 'app' }) }))).to.be.rejectedWith(
			'error-app-user-is-not-allowed-to-login',
		);
		await expect(validateLoginAttempt(createAttempt({ user: createUser({ active: false }) }))).to.be.rejectedWith(
			'error-user-is-not-activated',
		);
		await expect(validateLoginAttempt(createAttempt({ user: createUser({ roles: undefined }) }))).to.be.rejectedWith(
			'error-user-has-no-roles',
		);
	});

	it('requires a verified email only from password and passkey logins', async () => {
		settingsGet.withArgs('Accounts_EmailVerification').returns(true);

		await expect(validateLoginAttempt(createAttempt())).to.be.rejectedWith('error-invalid-email');
		await expect(validateLoginAttempt(createAttempt({ type: 'passkey' }))).to.be.rejectedWith('error-invalid-email');
		expect(await validateLoginAttempt(createAttempt({ type: 'cas' }))).to.equal(true);
	});

	it('hands the attempt the hooks returned to the rest of the policy', async () => {
		const attempt = createAttempt();
		const validated = { ...attempt, user: createUser({ _id: 'validated-user-id' }) };
		callbacksRun.withArgs('onValidateLogin').resolves(validated);

		expect(await validateLoginAttempt(attempt)).to.equal(true);

		expect(updateLastLoginById.calledOnceWithExactly('validated-user-id')).to.equal(true);
		await new Promise(setImmediate);
		expect(callbacksRun.calledWith('afterValidateLogin', validated)).to.equal(true);
	});

	it('runs the login hooks, stamps the last login and tells apps about every login but a resume', async () => {
		const attempt = createAttempt();
		expect(await validateLoginAttempt(attempt)).to.equal(true);

		expect(callbacksRun.calledWith('onValidateLogin')).to.equal(true);
		expect(updateLastLoginById.calledOnceWithExactly('user-id')).to.equal(true);
		expect(triggerEvent.calledOnceWithExactly('IPostUserLoggedIn', attempt.user)).to.equal(true);

		triggerEvent.reset();
		expect(await validateLoginAttempt(createAttempt({ type: 'resume' }))).to.equal(true);
		expect(triggerEvent.called).to.equal(false);
	});
});

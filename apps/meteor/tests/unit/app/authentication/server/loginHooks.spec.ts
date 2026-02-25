import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('authentication login hooks', () => {
	let onLoginFailureCallback: ((login: any) => Promise<void>) | undefined;

	const settingsGet = sinon.stub();
	const saveFailedLoginAttempts = sinon.stub();
	const saveSuccessfulLogin = sinon.stub();
	const logFailedLoginAttempts = sinon.stub();
	const callbacksAdd = sinon.stub();

	beforeEach(() => {
		onLoginFailureCallback = undefined;
		settingsGet.reset();
		saveFailedLoginAttempts.reset();
		saveSuccessfulLogin.reset();
		logFailedLoginAttempts.reset();
		callbacksAdd.reset();

		settingsGet.callsFake((key: string) => key === 'Block_Multiple_Failed_Logins_Enabled');

		proxyquire.noCallThru().load('../../../../../app/authentication/server/hooks/login', {
			'meteor/accounts-base': {
				Accounts: {
					onLoginFailure: (callback: (login: any) => Promise<void>) => {
						onLoginFailureCallback = callback;
					},
				},
			},
			'../../../../server/lib/callbacks': {
				callbacks: {
					add: callbacksAdd,
				},
			},
			'../../../settings/server': {
				settings: {
					get: settingsGet,
				},
			},
			'../lib/logLoginAttempts': {
				logFailedLoginAttempts,
			},
			'../lib/restrictLoginAttempts': {
				saveFailedLoginAttempts,
				saveSuccessfulLogin,
			},
		});
	});

	it('should ignore blocked-by-ip failures from failed-attempt persistence', async () => {
		expect(onLoginFailureCallback).to.not.be.undefined;

		await onLoginFailureCallback?.({
			error: { error: 'error-login-blocked-for-ip' },
			methodArguments: [{ user: { username: 'alice' } }],
		});

		expect(saveFailedLoginAttempts.called).to.be.false;
		expect(logFailedLoginAttempts.calledOnce).to.be.true;
	});

	it('should persist non-ignored failures', async () => {
		expect(onLoginFailureCallback).to.not.be.undefined;

		await onLoginFailureCallback?.({
			error: { error: 'error-too-many-requests' },
			methodArguments: [{ user: { username: 'alice' } }],
		});

		expect(saveFailedLoginAttempts.calledOnce).to.be.true;
		expect(logFailedLoginAttempts.calledOnce).to.be.true;
	});
});

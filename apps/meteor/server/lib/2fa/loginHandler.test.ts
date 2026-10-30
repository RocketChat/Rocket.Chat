import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import type { ILoginAttempt } from '../auth/ILoginAttempt';

const checkCodeForUser = sinon.stub();
const hooks = new Map<string, (login: ILoginAttempt) => Promise<ILoginAttempt>>();

proxyquire.noCallThru().load('./loginHandler', {
	'meteor/accounts-base': { Accounts: { registerLoginHandler: () => undefined } },
	'./code': { checkCodeForUser },
	'../callbacks': {
		callbacks: {
			add: (hook: string, callback: (login: ILoginAttempt) => Promise<ILoginAttempt>) => hooks.set(hook, callback),
			priority: { MEDIUM: 0 },
		},
	},
});

const validateLogin = (login: Partial<ILoginAttempt>) => {
	const callback = hooks.get('onValidateLogin');
	if (!callback) {
		throw new Error('the 2fa login callback was not registered');
	}
	return callback({ allowed: true, methodName: 'login', connection: {} as ILoginAttempt['connection'], ...login } as ILoginAttempt);
};

describe('2fa login callback', () => {
	beforeEach(() => {
		checkCodeForUser.reset();
		checkCodeForUser.resolves(true);
	});

	it('asks password logins for a second factor', async () => {
		const user = { _id: 'user-id' } as ILoginAttempt['user'];

		await validateLogin({ type: 'password', user, methodArguments: [{ totp: { code: '123456' } }] });

		expect(checkCodeForUser.calledOnce).to.equal(true);
		expect(checkCodeForUser.firstCall.args[0]).to.deep.equal({
			user,
			code: '123456',
			options: { disablePasswordFallback: true, issueResendChallenge: true },
		});
	});

	it('does not ask passkey logins for a second factor, since the passkey verified the user', async () => {
		await validateLogin({ type: 'passkey', user: { _id: 'user-id' } as ILoginAttempt['user'], methodArguments: [{}] });

		expect(checkCodeForUser.called).to.equal(false);
	});
});

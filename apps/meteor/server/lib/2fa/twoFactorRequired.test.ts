import { before, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

const checkCodeForUser = sinon.stub();
const method = sinon.stub();

let twoFactorRequired: typeof import('./twoFactorRequired').twoFactorRequired;

before(async () => {
	mock.module('./code', { exports: { checkCodeForUser } });
	({ twoFactorRequired } = await import('./twoFactorRequired'));
});

describe('twoFactorRequired', () => {
	const connection = { id: 'connection-id', clientAddress: '127.0.0.1', httpHeaders: {} };
	const options = { requireSecondFactor: true };
	const call = (context: object, ...args: unknown[]) => (twoFactorRequired(method, options) as any).apply(context, args);

	beforeEach(() => {
		checkCodeForUser.reset();
		checkCodeForUser.resolves(true);
		method.reset();
		method.resolves('result');
	});

	it('should check the code from the last argument and call the method without it', async () => {
		const context = { userId: 'user-id', connection };

		expect(await call(context, { name: 'Alice' }, { twoFactorCode: '123456', twoFactorMethod: 'totp' })).to.equal('result');

		expect(checkCodeForUser.args).to.deep.equal([[{ user: 'user-id', connection, code: '123456', method: 'totp', options }]]);
		expect(method.calledOnceWithExactly({ name: 'Alice' })).to.be.true;
	});

	it('should keep the last argument for the method and ask for a code when it holds no code', async () => {
		await call({ userId: 'user-id', connection }, { name: 'Alice' });

		expect(checkCodeForUser.args).to.deep.equal([[{ user: 'user-id', connection, options }]]);
		expect(method.calledOnceWithExactly({ name: 'Alice' })).to.be.true;
	});

	it('should not call the method when the code is refused', async () => {
		checkCodeForUser.rejects(new Error('totp-invalid'));

		await expect(call({ userId: 'user-id', connection }, { twoFactorCode: '000000', twoFactorMethod: 'totp' })).to.be.rejectedWith(
			'totp-invalid',
		);

		expect(method.called).to.be.false;
	});

	it('should refuse a caller who is not logged in', async () => {
		await expect(call({ connection }, { name: 'Alice' })).to.be.rejectedWith('Unauthenticated');

		expect(checkCodeForUser.called).to.be.false;
		expect(method.called).to.be.false;
	});
});

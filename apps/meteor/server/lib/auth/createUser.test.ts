import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const Users = {
	findOneByUsernameIgnoringCase: sinon.stub(),
	findOneByEmailAddress: sinon.stub(),
	findOneByUsernameIgnoringCaseExceptId: sinon.stub(),
	findOneByEmailAddressExceptId: sinon.stub(),
	removeById: sinon.stub(),
};
const insertUser = sinon.stub();
const hashPassword = sinon.stub();

let createUser: any;

before(async () => {
	mock.module('@rocket.chat/account-utils', { exports: { hashPassword } });
	mock.module('./insertUser', { exports: { insertUser } });
	({ createUser } = await import('./createUser'));
});

describe('createUser', () => {
	before(() => {
		mockModel('Users', Users);
	});

	beforeEach(() => {
		for (const stub of [...Object.values(Users), insertUser, hashPassword]) {
			stub.reset();
		}
		Object.values(Users).forEach((stub) => stub.resolves(null));
		insertUser.resolves('new-user-id');
		hashPassword.callsFake(async (password: string) => `hashed:${password}`);
	});

	it('should require a username or an email', async () => {
		await expect(createUser({ password: 'secret' })).to.be.rejectedWith('Need to set a username or email');
		sinon.assert.notCalled(insertUser);
	});

	it('should insert a password user with an unverified email and pass the options through', async () => {
		const options = { username: 'alice', email: 'alice@example.com', password: 'secret', joinDefaultChannels: false };

		expect(await createUser(options)).to.equal('new-user-id');

		sinon.assert.calledOnceWithExactly(insertUser, options, {
			services: { password: { bcrypt: 'hashed:secret' } },
			username: 'alice',
			emails: [{ address: 'alice@example.com', verified: false }],
		});
	});

	it('should insert a user without a password with empty services', async () => {
		await createUser({ email: 'alice@example.com' });

		sinon.assert.notCalled(hashPassword);
		expect(insertUser.firstCall.args[1]).to.deep.equal({ services: {}, emails: [{ address: 'alice@example.com', verified: false }] });
	});

	it('should refuse a username or email another user has, in any case', async () => {
		Users.findOneByUsernameIgnoringCase.withArgs('Alice').resolves({ _id: 'other' });
		await expect(createUser({ username: 'Alice' })).to.be.rejectedWith('Something went wrong. Please check your credentials.');

		Users.findOneByEmailAddress.withArgs('ALICE@example.com').resolves({ _id: 'other' });
		await expect(createUser({ email: 'ALICE@example.com' })).to.be.rejectedWith('Something went wrong. Please check your credentials.');

		sinon.assert.notCalled(insertUser);
	});

	it('should remove the new user when another one took the email meanwhile', async () => {
		Users.findOneByEmailAddressExceptId.withArgs('alice@example.com', 'new-user-id').resolves({ _id: 'other' });

		await expect(createUser({ username: 'alice', email: 'alice@example.com' })).to.be.rejectedWith(
			'Something went wrong. Please check your credentials.',
		);

		sinon.assert.calledOnceWithExactly(Users.findOneByUsernameIgnoringCaseExceptId, 'alice', 'new-user-id', { projection: { _id: 1 } });
		sinon.assert.calledOnceWithExactly(Users.removeById, 'new-user-id');
	});

	it('should remove the new user when another one took the username meanwhile', async () => {
		Users.findOneByUsernameIgnoringCaseExceptId.withArgs('alice', 'new-user-id').resolves({ _id: 'other' });

		await expect(createUser({ username: 'alice', email: 'alice@example.com' })).to.be.rejectedWith(
			'Something went wrong. Please check your credentials.',
		);

		sinon.assert.notCalled(Users.findOneByEmailAddressExceptId);
		sinon.assert.calledOnceWithExactly(Users.removeById, 'new-user-id');
	});
});

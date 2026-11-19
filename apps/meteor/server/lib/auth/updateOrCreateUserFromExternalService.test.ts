import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const Users = {
	findOneByEmailAddress: sinon.stub(),
	resetPasswordAndSetRequirePasswordChange: sinon.stub(),
	setServiceId: sinon.stub(),
	setEmailVerified: sinon.stub(),
	findOneByServiceId: sinon.stub(),
	setServiceDataById: sinon.stub(),
	findOneById: sinon.stub(),
};
const insertUser = sinon.stub();
const isCustomOAuthServiceAllowed = sinon.stub();
const processCustomOAuthUser = sinon.stub();
const runCallback = sinon.stub();
const loginAuthenticatedUserRequest = sinon.stub();
const settingValues = new Map<string, unknown>();

let updateOrCreateUserFromExternalService: any;

before(async () => {
	mock.module('@rocket.chat/core-services', { exports: { LDAP: { loginAuthenticatedUserRequest } } });
	mock.module('./insertUser', { exports: { insertUser } });
	mock.module('../../settings', { exports: { settings: { get: (key: string) => settingValues.get(key) } } });
	mock.module('../auth-providers/custom-oauth/customOAuth', { exports: { isCustomOAuthServiceAllowed, processCustomOAuthUser } });
	mock.module('../callbacks', { exports: { callbacks: { run: runCallback } } });
	({ updateOrCreateUserFromExternalService } = await import('./updateOrCreateUserFromExternalService'));
});

const localUser = { _id: 'local-user', username: 'alice' };

describe('updateOrCreateUserFromExternalService', () => {
	before(() => {
		mockModel('Users', Users);
	});

	beforeEach(() => {
		for (const stub of [
			...Object.values(Users),
			insertUser,
			isCustomOAuthServiceAllowed,
			processCustomOAuthUser,
			runCallback,
			loginAuthenticatedUserRequest,
		]) {
			stub.reset();
		}
		settingValues.clear();
		Users.findOneByEmailAddress.resolves(null);
		Users.findOneByServiceId.resolves(null);
		Users.findOneById.resolves(localUser);
		insertUser.resolves('local-user');
		isCustomOAuthServiceAllowed.returns(true);
	});

	describe('existing and new users', () => {
		it('should update the service data of the user already linked to the service id', async () => {
			Users.findOneByServiceId.resolves({ _id: 'local-user' });
			const serviceData = { id: 'gh-1', accessToken: 'token', email: 'alice@example.com' };

			expect(await updateOrCreateUserFromExternalService('github', serviceData, { profile: { name: 'Alice' } })).to.deep.equal({
				type: 'github',
				userId: 'local-user',
			});

			sinon.assert.calledOnceWithExactly(Users.findOneByServiceId, 'github', 'gh-1', { projection: { _id: 1 } });
			sinon.assert.calledOnceWithExactly(Users.setServiceDataById, 'local-user', 'github', serviceData);
			sinon.assert.notCalled(insertUser);
		});

		it('should create a user holding the service data with the given options', async () => {
			const serviceData = { id: 'gh-1' };
			const options = { profile: { name: 'Alice' } };

			expect(await updateOrCreateUserFromExternalService('github', serviceData, options)).to.deep.equal({
				type: 'github',
				userId: 'local-user',
			});

			sinon.assert.calledOnceWithExactly(insertUser, options, { services: { github: serviceData } });
			expect(insertUser.firstCall.args[0]).not.to.equal(options);
			sinon.assert.notCalled(Users.setServiceDataById);
		});

		it('should refuse internal services and service data without an id', async () => {
			await expect(updateOrCreateUserFromExternalService('password', { id: 'x' })).to.be.rejectedWith('internal service password');
			await expect(updateOrCreateUserFromExternalService('resume', { id: 'x' })).to.be.rejectedWith('internal service resume');
			await expect(updateOrCreateUserFromExternalService('github', {})).to.be.rejectedWith('must include id');
			sinon.assert.notCalled(insertUser);
		});
	});

	describe('claiming a user with the same email', () => {
		const serviceData = { id: 'gh-1', email: 'alice@example.com' };

		it('should link the service to the user with that email and verify it', async () => {
			Users.findOneByEmailAddress.resolves({ _id: 'local-user', emails: [{ address: 'alice@example.com', verified: true }] });

			await updateOrCreateUserFromExternalService('github', serviceData);

			sinon.assert.calledOnceWithExactly(Users.setServiceId, 'local-user', 'github', 'gh-1');
			sinon.assert.calledOnceWithExactly(Users.setEmailVerified, 'local-user', 'alice@example.com');
			sinon.assert.notCalled(Users.resetPasswordAndSetRequirePasswordChange);
			sinon.assert.callOrder(Users.setServiceId, Users.findOneByServiceId);
		});

		it('should force a password change when the user has a password but never verified that email', async () => {
			Users.findOneByEmailAddress.resolves({
				_id: 'local-user',
				services: { password: { bcrypt: 'hash' } },
				emails: [{ address: 'alice@example.com', verified: false }],
			});

			await updateOrCreateUserFromExternalService('google', serviceData);

			sinon.assert.calledOnceWithExactly(
				Users.resetPasswordAndSetRequirePasswordChange,
				'local-user',
				true,
				'This_email_has_already_been_used_and_has_not_been_verified__Please_change_your_password',
			);
		});

		it('should leave a user already linked to the same service id alone', async () => {
			Users.findOneByEmailAddress.resolves({ _id: 'local-user', services: { github: { id: 'gh-1' } } });

			await updateOrCreateUserFromExternalService('github', serviceData);

			sinon.assert.notCalled(Users.setServiceId);
			sinon.assert.notCalled(Users.setEmailVerified);
		});

		it('should only claim for the built-in providers and custom OAuth services', async () => {
			Users.findOneByEmailAddress.resolves({ _id: 'local-user' });

			await updateOrCreateUserFromExternalService('saml', serviceData);
			sinon.assert.notCalled(Users.findOneByEmailAddress);

			await updateOrCreateUserFromExternalService('my-idp', { ...serviceData, _OAuthCustom: true });
			sinon.assert.calledOnceWithExactly(Users.setServiceId, 'local-user', 'my-idp', 'gh-1');
		});

		it('should not look up users when the service gives no email', async () => {
			await updateOrCreateUserFromExternalService('github', { id: 'gh-1' });

			sinon.assert.notCalled(Users.findOneByEmailAddress);
		});
	});

	describe('custom OAuth', () => {
		it('should stop after the email claim when the custom OAuth service is not licensed', async () => {
			Users.findOneByEmailAddress.resolves({ _id: 'local-user' });
			isCustomOAuthServiceAllowed.withArgs('my-idp').returns(false);

			expect(await updateOrCreateUserFromExternalService('my-idp', { id: '1', email: 'a@example.com', _OAuthCustom: true })).to.be
				.undefined;

			sinon.assert.calledOnce(Users.setServiceId);
			sinon.assert.notCalled(processCustomOAuthUser);
			sinon.assert.notCalled(Users.findOneByServiceId);
			sinon.assert.notCalled(insertUser);
		});

		it('should process the custom OAuth user before looking the user up', async () => {
			const serviceData = { id: '1' };

			await updateOrCreateUserFromExternalService('my-idp', serviceData);

			sinon.assert.calledOnceWithExactly(processCustomOAuthUser, 'my-idp', serviceData);
			sinon.assert.callOrder(processCustomOAuthUser, Users.findOneByServiceId);
		});

		it('should propagate a refusal from the custom OAuth processing', async () => {
			const error = new Error('User with username alice already exists');
			processCustomOAuthUser.rejects(error);

			await expect(updateOrCreateUserFromExternalService('my-idp', { id: '1' })).to.be.rejectedWith(error);
			sinon.assert.notCalled(insertUser);
		});
	});

	describe('after login', () => {
		const serviceData = { id: 'gh-1' };

		it('should run the new OAuth user callback with the full user', async () => {
			await updateOrCreateUserFromExternalService('github', serviceData);

			sinon.assert.calledOnceWithExactly(Users.findOneById, 'local-user');
			sinon.assert.calledOnceWithExactly(runCallback, 'afterValidateNewOAuthUser', {
				identity: serviceData,
				serviceName: 'github',
				user: localUser,
			});
			sinon.assert.notCalled(loginAuthenticatedUserRequest);
		});

		it('should refresh LDAP data before the callback when configured and the user has a username', async () => {
			settingValues.set('LDAP_Update_Data_On_OAuth_Login', true);

			await updateOrCreateUserFromExternalService('github', serviceData);
			sinon.assert.calledOnceWithExactly(loginAuthenticatedUserRequest, 'alice');
			sinon.assert.callOrder(loginAuthenticatedUserRequest, runCallback);

			loginAuthenticatedUserRequest.resetHistory();
			Users.findOneById.resolves({ _id: 'local-user' });
			await updateOrCreateUserFromExternalService('github', serviceData);
			sinon.assert.notCalled(loginAuthenticatedUserRequest);
		});

		it('should propagate a failure to create or update the user without running the after-login steps', async () => {
			settingValues.set('LDAP_Update_Data_On_OAuth_Login', true);
			const insertError = new Error('insert failed');
			insertUser.rejects(insertError);

			await expect(updateOrCreateUserFromExternalService('github', serviceData)).to.be.rejectedWith(insertError);

			const updateError = new Error('update failed');
			Users.findOneByServiceId.resolves({ _id: 'local-user' });
			Users.setServiceDataById.rejects(updateError);

			await expect(updateOrCreateUserFromExternalService('github', serviceData)).to.be.rejectedWith(updateError);

			sinon.assert.notCalled(Users.findOneById);
			sinon.assert.notCalled(loginAuthenticatedUserRequest);
			sinon.assert.notCalled(runCallback);
		});

		it('should return nothing when the user cannot be loaded', async () => {
			Users.findOneById.resolves(null);

			expect(await updateOrCreateUserFromExternalService('github', serviceData)).to.be.undefined;
			sinon.assert.notCalled(runCallback);
		});

		it('should skip the callback when the LDAP refresh fails', async () => {
			settingValues.set('LDAP_Update_Data_On_OAuth_Login', true);
			const error = new Error('LDAP unavailable');
			loginAuthenticatedUserRequest.rejects(error);

			await expect(updateOrCreateUserFromExternalService('github', serviceData)).to.be.rejectedWith(error);
			sinon.assert.notCalled(runCallback);
		});
	});
});

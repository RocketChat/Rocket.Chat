import { before, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

const syncOAuthUserRolesStub = sinon.stub();

let OAuthEEManager: typeof import('./Manager').OAuthEEManager;

before(async () => {
	mock.module('@rocket.chat/logger', { exports: { Logger: class { error = sinon.stub(); } } });
	mock.module('@rocket.chat/models', {
		exports: {
			Roles: { findInIdsOrNames: sinon.stub(), findOneByIdOrName: sinon.stub() },
			Rooms: {},
			Users: {},
		},
	});
	mock.module('../../../../server/lib/rooms/addUserToRoom', { exports: { addUserToRoom: sinon.stub() } });
	mock.module('../../../../server/lib/rooms/createRoom', { exports: { createRoom: sinon.stub() } });
	mock.module('../../../../server/lib/utils/lib/getValidRoomName', { exports: { getValidRoomName: sinon.stub() } });
	mock.module('./syncOAuthUserRoles', { exports: { _syncOAuthUserRoles: syncOAuthUserRolesStub } });
	mock.module('../syncUserRoles', { exports: { syncUserRoles: sinon.stub() } });

	({ OAuthEEManager } = await import('./Manager'));
});

describe('OAuthEEManager.updateRolesFromSSO', () => {
	beforeEach(() => {
		syncOAuthUserRolesStub.reset();
		syncOAuthUserRolesStub.resolves();
	});

	it('forwards user, identity, role claim and rolesToSync once', async () => {
		const user = { _id: 'user-id', roles: ['user'] };
		const identity = { roles: ['admin'] };

		await OAuthEEManager.updateRolesFromSSO(user, identity, 'roles', 'admin,user');

		expect(syncOAuthUserRolesStub.calledOnce).to.be.true;
		expect(syncOAuthUserRolesStub.firstCall.args[1]).to.deep.equal({
			user,
			identity,
			roleClaimName: 'roles',
			rolesToSync: 'admin,user',
		});
	});

	it('propagates a delegated synchronization error', async () => {
		const error = new Error('sync failed');
		syncOAuthUserRolesStub.rejects(error);

		await expect(
			OAuthEEManager.updateRolesFromSSO(
				{ _id: 'user-id', roles: ['user'] },
				{ roles: ['admin'] },
				'roles',
				'admin,user',
			),
		).to.be.rejectedWith(error);
	});
});

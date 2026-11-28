import { before, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

const findInIdsOrNames = sinon.stub();
const findOneByIdOrName = sinon.stub();
const syncUserRoles = sinon.stub();

let syncOAuthUserRoles: typeof import('./Manager').syncOAuthUserRoles;

before(async () => {
	mock.module('@rocket.chat/logger', { exports: { Logger: class { error = sinon.stub(); } } });
	mock.module('@rocket.chat/models', {
		exports: {
			Roles: { findInIdsOrNames, findOneByIdOrName },
			Rooms: {},
			Users: {},
		},
	});
	mock.module('../../../../server/lib/rooms/addUserToRoom', { exports: { addUserToRoom: sinon.stub() } });
	mock.module('../../../../server/lib/rooms/createRoom', { exports: { createRoom: sinon.stub() } });
	mock.module('../../../../server/lib/utils/lib/getValidRoomName', { exports: { getValidRoomName: sinon.stub() } });
	mock.module('../syncUserRoles', { exports: { syncUserRoles } });

	({ syncOAuthUserRoles } = await import('./Manager'));
});

beforeEach(() => {
	findInIdsOrNames.reset();
	findOneByIdOrName.reset();
	syncUserRoles.reset();
});

describe('syncOAuthUserRoles', () => {
	it('normalizes undefined rolesToSync to an empty allowlist', async () => {
		findInIdsOrNames.onFirstCall().returns({ toArray: async () => [{ _id: 'role-user' }] });
		findInIdsOrNames.onSecondCall().returns({ toArray: async () => [] });
		findOneByIdOrName.resolves({ _id: 'role-user' });
		syncUserRoles.resolves();

		await syncOAuthUserRoles({
			user: { _id: 'user-id', roles: [] },
			identity: { roles: ['user'] },
			roleClaimName: 'roles',
			rolesToSync: undefined,
		});

		expect(findInIdsOrNames.firstCall.args[0]).to.deep.equal(['user']);
		expect(findInIdsOrNames.secondCall.args[0]).to.deep.equal(['']);
		expect(syncUserRoles.calledOnceWithExactly('user-id', ['role-user'], { allowedRoles: [] })).to.be.true;
	});

	it('splits and trims comma-separated rolesToSync', async () => {
		findInIdsOrNames.onFirstCall().returns({ toArray: async () => [{ _id: 'role-admin' }] });
		findInIdsOrNames.onSecondCall().returns({ toArray: async () => [{ _id: 'role-admin' }, { _id: 'role-user' }] });
		findOneByIdOrName.resolves({ _id: 'role-admin' });
		syncUserRoles.resolves();

		await syncOAuthUserRoles({
			user: { _id: 'user-id', roles: [] },
			identity: { roles: ['admin', 'user'] },
			roleClaimName: 'roles',
			rolesToSync: ' admin, user ',
		});

		expect(findInIdsOrNames.secondCall.args[0]).to.deep.equal(['admin', 'user']);
		expect(syncUserRoles.calledOnce).to.be.true;
		expect(syncUserRoles.firstCall.args[2]).to.deep.equal({ allowedRoles: ['role-admin', 'role-user'] });
	});

	it('maps array elements directly and preserves commas in role names', async () => {
		findInIdsOrNames.onFirstCall().returns({ toArray: async () => [{ _id: 'role-comma' }] });
		findInIdsOrNames.onSecondCall().returns({ toArray: async () => [{ _id: 'role-comma' }] });
		findOneByIdOrName.resolves({ _id: 'role-comma' });
		syncUserRoles.resolves();

		await syncOAuthUserRoles({
			user: { _id: 'user-id', roles: [] },
			identity: { roles: ['role,admin'] },
			roleClaimName: 'roles',
			rolesToSync: [' role,admin '],
		});

		expect(findInIdsOrNames.secondCall.args[0]).to.deep.equal(['role,admin']);
		expect(syncUserRoles.calledOnceWithExactly('user-id', ['role-comma'], { allowedRoles: ['role-comma'] })).to.be.true;
	});

	it('propagates role lookup errors', async () => {
		const error = new Error('role lookup failed');
		findInIdsOrNames.returns({
			toArray: async () => {
				throw error;
			},
		});

		await expect(
			syncOAuthUserRoles({
				user: { _id: 'user-id', roles: [] },
				identity: { roles: ['admin'] },
				roleClaimName: 'roles',
				rolesToSync: 'admin,user',
			}),
		).to.be.rejectedWith(error);
		expect(syncUserRoles.called).to.be.false;
	});

	it('propagates synchronization errors', async () => {
		const error = new Error('sync failed');
		findInIdsOrNames.onFirstCall().returns({ toArray: async () => [{ _id: 'role-admin' }] });
		findInIdsOrNames.onSecondCall().returns({ toArray: async () => [{ _id: 'role-admin' }] });
		findOneByIdOrName.resolves({ _id: 'role-admin' });
		syncUserRoles.rejects(error);

		await expect(
			syncOAuthUserRoles({
				user: { _id: 'user-id', roles: [] },
				identity: { roles: ['admin'] },
				roleClaimName: 'roles',
				rolesToSync: 'admin',
			}),
		).to.be.rejectedWith(error);
	});
});

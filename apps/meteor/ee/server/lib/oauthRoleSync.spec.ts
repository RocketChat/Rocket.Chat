import { expect } from 'chai';
import sinon from 'sinon';

import { _syncOAuthUserRoles } from './oauth/syncOAuthUserRoles';
import { filterRoleList } from './filterRoleList';

describe('OAuth role sync', () => {
	it('normalizes a missing rolesToSync setting to an empty restrictive allowlist', async () => {
		const findRoles = sinon.stub();
		findRoles.onFirstCall().resolves([{ _id: 'role-user' }]);
		findRoles.onSecondCall().resolves([]);
		const mapRolesFromSSO = sinon.stub().resolves(['user']);
		const syncUserRoles = sinon.stub().resolves();

		await _syncOAuthUserRoles(
			{ findRoles, mapRolesFromSSO, syncUserRoles },
			{
				user: { _id: 'user-id', roles: [] },
				identity: { roles: ['user'] },
				roleClaimName: 'roles',
				rolesToSync: undefined,
			},
		);

		expect(mapRolesFromSSO.calledOnceWithExactly({ roles: ['user'] }, 'roles')).to.be.true;
		expect(findRoles.secondCall.args[0]).to.deep.equal(['']);
		expect(syncUserRoles.calledOnce).to.be.true;
		expect(syncUserRoles.firstCall.args).to.deep.equal([
			'user-id',
			['role-user'],
			{ allowedRoles: [] },
		]);
	});

	it('uses the shared helper for both existing and new OAuth user shapes', async () => {
		const findRoles = sinon.stub();
		findRoles.resolves([]);
		const mapRolesFromSSO = sinon.stub().resolves([]);
		const syncUserRoles = sinon.stub().resolves();

		const existingUserOptions = {
			user: { _id: 'existing-id', roles: [] },
			identity: { roles: ['user'] },
			roleClaimName: 'roles',
			rolesToSync: '',
		};
		const newUserOptions = {
			user: { _id: 'new-id', roles: [] },
			identity: { roles: ['user'] },
			roleClaimName: 'roles',
			rolesToSync: '',
		};

		await _syncOAuthUserRoles({ findRoles, mapRolesFromSSO, syncUserRoles }, existingUserOptions);
		await _syncOAuthUserRoles({ findRoles, mapRolesFromSSO, syncUserRoles }, newUserOptions);

		expect(syncUserRoles.firstCall.args[0]).to.equal('existing-id');
		expect(syncUserRoles.secondCall.args[0]).to.equal('new-id');
		expect(syncUserRoles.firstCall.args[2]).to.deep.equal({ allowedRoles: [] });
		expect(syncUserRoles.secondCall.args[2]).to.deep.equal({ allowedRoles: [] });
	});

	it('rejects all role additions and removals with an empty allowlist', () => {
		expect(filterRoleList(['role-user'], [], [])).to.deep.equal([]);
		expect(filterRoleList(['role-admin'], ['role-user'], [])).to.deep.equal([]);
		expect(filterRoleList(['role-admin'], [], [])).to.deep.equal([]);
	});

	it('preserves unrestricted behavior when allowedRoles is undefined', () => {
		expect(filterRoleList(['role-user'], [], undefined)).to.deep.equal(['role-user']);
		expect(filterRoleList(['role-admin'], ['role-user'], undefined)).to.deep.equal(['role-admin']);
		expect(filterRoleList(['role-admin'], [], undefined)).to.deep.equal(['role-admin']);
	});
});

import { describe, it } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

import { createOAuthCallbacks } from './oauthCallbacks';

const setupSettings = ({ mergeRoles = true, mapChannels = true } = {}) => {
	const values: Record<string, unknown> = {
		'Accounts_OAuth_Custom-Myprovider-map_channels': mapChannels,
		'Accounts_OAuth_Custom-Myprovider-merge_roles': mergeRoles,
		'Accounts_OAuth_Custom-Myprovider-roles_to_sync': 'admin, user',
		'Accounts_OAuth_Custom-Myprovider-roles_claim': 'roles',
		'Accounts_OAuth_Custom-Myprovider-groups_claim': 'groups',
		'Accounts_OAuth_Custom-Myprovider-channels_admin': 'admin',
		'Accounts_OAuth_Custom-Myprovider-groups_channel_map': '{"group":"channel"}',
	};
	return { get: sinon.stub().callsFake((key: string) => values[key]) };
};

const makeDependencies = ({ mergeRoles = true, mapChannels = true } = {}) => {
	const settings = setupSettings({ mergeRoles, mapChannels });
	const mapSSOGroupsToChannels = sinon.stub().resolves();
	const updateRolesFromSSO = sinon.stub().resolves();
	const syncOAuthUserRoles = sinon.stub().resolves();

	return {
		settings,
		oAuthEEManager: { mapSSOGroupsToChannels, updateRolesFromSSO } as any,
		syncOAuthUserRoles,
		logger: { error: sinon.stub() },
		mapSSOGroupsToChannels,
		updateRolesFromSSO,
	};
};

describe('Custom OAuth callbacks', () => {
	it('routes existing OAuth users through updateRolesFromSSO and channel mapping', async () => {
		const deps = makeDependencies();
		const callbacks = createOAuthCallbacks(deps);
		const user = { _id: 'existing-user', roles: ['user'] } as any;
		const serviceData = { id: 'identity-id', roles: ['admin'] };

		await callbacks.afterProcessOAuthUser({ serviceName: 'myprovider', serviceData, user });

		expect(deps.settings.get.firstCall.args[0]).to.equal('Accounts_OAuth_Custom-Myprovider-map_channels');
		expect(deps.mapSSOGroupsToChannels.calledOnceWithExactly(user, serviceData, 'groups', { group: 'channel' }, 'admin')).to.be.true;
		expect(deps.updateRolesFromSSO.calledOnceWithExactly(user, serviceData, 'roles', 'admin, user')).to.be.true;
		expect(deps.syncOAuthUserRoles.called).to.be.false;
	});

	it('routes new OAuth users through syncOAuthUserRoles and channel mapping', async () => {
		const deps = makeDependencies();
		const callbacks = createOAuthCallbacks(deps);
		const user = { _id: 'new-user', roles: [] } as any;
		const identity = { id: 'identity-id', roles: ['admin'] };

		await callbacks.afterValidateNewOAuthUser({ serviceName: 'myprovider', identity, user });

		expect(deps.settings.get.firstCall.args[0]).to.equal('Accounts_OAuth_Custom-Myprovider-map_channels');
		expect(deps.mapSSOGroupsToChannels.calledOnceWithExactly(user, identity, 'groups', { group: 'channel' }, 'admin')).to.be.true;
		expect(deps.syncOAuthUserRoles.calledOnceWithExactly({ user, identity, roleClaimName: 'roles', rolesToSync: 'admin, user' })).to.be.true;
		expect(deps.updateRolesFromSSO.called).to.be.false;
	});

	it('uses an empty rolesToSync for an existing OAuth user when the setting is omitted', async () => {
		const settings = {
			get: sinon.stub().callsFake((key: string) => {
				const values: Record<string, unknown> = {
					'Accounts_OAuth_Custom-Myprovider-map_channels': false,
					'Accounts_OAuth_Custom-Myprovider-merge_roles': true,
					'Accounts_OAuth_Custom-Myprovider-roles_claim': 'roles',
					'Accounts_OAuth_Custom-Myprovider-groups_claim': 'groups',
					'Accounts_OAuth_Custom-Myprovider-channels_admin': 'admin',
					'Accounts_OAuth_Custom-Myprovider-groups_channel_map': '{}',
				};
				return values[key];
			}),
		};
		const deps = makeDependencies({ mergeRoles: true, mapChannels: false });
		deps.settings = settings;
		const callbacks = createOAuthCallbacks(deps);
		const user = { _id: 'existing-user', roles: ['user'] } as any;

		await callbacks.afterProcessOAuthUser({ serviceName: 'myprovider', serviceData: {}, user });

		expect(deps.updateRolesFromSSO.calledOnceWithExactly(user, {}, 'roles', '')).to.be.true;
	});

	it('uses an empty rolesToSync for a new OAuth user when the setting is omitted', async () => {
		const settings = {
			get: sinon.stub().callsFake((key: string) => {
				const values: Record<string, unknown> = {
					'Accounts_OAuth_Custom-Myprovider-map_channels': false,
					'Accounts_OAuth_Custom-Myprovider-merge_roles': true,
					'Accounts_OAuth_Custom-Myprovider-roles_claim': 'roles',
					'Accounts_OAuth_Custom-Myprovider-groups_claim': 'groups',
					'Accounts_OAuth_Custom-Myprovider-channels_admin': 'admin',
					'Accounts_OAuth_Custom-Myprovider-groups_channel_map': '{}',
				};
				return values[key];
			}),
		};
		const deps = makeDependencies({ mergeRoles: true, mapChannels: false });
		deps.settings = settings;
		const callbacks = createOAuthCallbacks(deps);
		const user = { _id: 'new-user', roles: [] } as any;
		const identity = { id: 'identity-id', roles: ['admin'] };

		await callbacks.afterValidateNewOAuthUser({ serviceName: 'myprovider', identity, user });

		expect(deps.syncOAuthUserRoles.calledOnceWithExactly({ user, identity, roleClaimName: 'roles', rolesToSync: '' })).to.be.true;
	});

	it('skips existing-user role synchronization when mergeRoles is false', async () => {
		const deps = makeDependencies({ mergeRoles: false, mapChannels: false });
		const callbacks = createOAuthCallbacks(deps);

		await callbacks.afterProcessOAuthUser({ serviceName: 'myprovider', serviceData: {}, user: { _id: 'existing-user' } as any });

		expect(deps.updateRolesFromSSO.called).to.be.false;
		expect(deps.mapSSOGroupsToChannels.called).to.be.false;
	});

	it('skips new-user role synchronization when mergeRoles is false', async () => {
		const deps = makeDependencies({ mergeRoles: false, mapChannels: false });
		const callbacks = createOAuthCallbacks(deps);

		await callbacks.afterValidateNewOAuthUser({ serviceName: 'myprovider', identity: {}, user: { _id: 'new-user' } as any });

		expect(deps.syncOAuthUserRoles.called).to.be.false;
		expect(deps.mapSSOGroupsToChannels.called).to.be.false;
	});
});

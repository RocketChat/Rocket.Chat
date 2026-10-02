import type { IRole } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useUserRolesByScope } from './useUserRolesByScope';
import { Roles } from '../stores';

const rid = 'room-1';
const uid = 'member-id';

const role = (_id: string, scope: IRole['scope'], description = ''): IRole => ({
	_id,
	name: _id,
	description,
	scope,
	protected: false,
	_updatedAt: new Date(),
});

beforeEach(() => {
	Roles.state.replaceAll([
		role('admin', 'Users', 'Administrator'),
		role('custom-role', 'Users'),
		role('owner', 'Subscriptions', 'Owner'),
		role('guest', 'Users', 'Guest'),
	]);
});

it('splits the user roles into workspace and room roles, labelled by description or name', async () => {
	const { result } = renderHook(() => useUserRolesByScope(uid, rid), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('GET', '/v1/roles.getUsersInPublicRoles', () => ({
				users: [{ _id: uid, username: 'member', roles: ['admin', 'custom-role'] }],
			}))
			.withEndpoint('GET', '/v1/rooms.roles', () => ({ roles: [{ rid, u: { _id: uid, username: 'member' }, roles: ['owner'] }] }))
			.build(),
	});

	await waitFor(() => expect(result.current).toEqual({ workspaceRoles: ['Administrator', 'custom-role'], roomRoles: ['Owner'] }));
});

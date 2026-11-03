import type { IRole } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useRolesByUser } from './useRolesByUser';
import { Roles } from '../../../../stores';

const rid = 'room-1';

const role = (_id: string, scope: IRole['scope'], description = ''): IRole => ({
	_id,
	name: _id,
	description,
	scope,
	protected: false,
	_updatedAt: new Date(),
});

const wrapper = mockAppRoot()
	.withJohnDoe()
	.withEndpoint('GET', '/v1/roles.getUsersInPublicRoles', () => ({
		users: [
			{ _id: 'admin-id', username: 'admin', roles: ['admin', 'no-description'] },
			{ _id: 'owner-id', username: 'owner', roles: [] },
		],
	}))
	.withEndpoint('GET', '/v1/rooms.roles', () => ({
		roles: [{ rid, u: { _id: 'owner-id', username: 'owner' }, roles: ['owner'] }],
	}))
	.build();

beforeEach(() => {
	Roles.state.replaceAll([
		role('admin', 'Users', 'Administrator'),
		role('owner', 'Subscriptions', 'Owner'),
		role('no-description', 'Users'),
	]);
});

it("labels each author's workspace and room roles by description, leaving out roles without one", async () => {
	const { result } = renderHook(() => useRolesByUser(rid, true), { wrapper });

	await waitFor(() => expect(result.current?.get('owner-id')).toEqual({ workspaceRoles: [], roomRoles: ['Owner'] }));
	expect(result.current?.rid).toBe(rid);
	expect(result.current?.get('admin-id')).toEqual({ workspaceRoles: ['Administrator'], roomRoles: [] });
});

it('gives the same labels object to every message of the same author', async () => {
	const { result } = renderHook(() => useRolesByUser(rid, true), { wrapper });

	await waitFor(() => expect(result.current?.get('admin-id').workspaceRoles).toEqual(['Administrator']));
	expect(result.current?.get('admin-id')).toBe(result.current?.get('admin-id'));
	expect(result.current?.get('unknown-id')).toEqual({ workspaceRoles: [], roomRoles: [] });
});

it('resolves nothing while roles are hidden', () => {
	const { result } = renderHook(() => useRolesByUser(rid, false), { wrapper });

	expect(result.current).toBeUndefined();
});

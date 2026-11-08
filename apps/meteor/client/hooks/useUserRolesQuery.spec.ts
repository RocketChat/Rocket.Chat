import { mockAppRoot, type StreamControllerRef } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useUserRolesQuery } from './useUserRolesQuery';

const member = { _id: 'member-id', username: 'member', name: 'Member' };

const renderUserRoles = () => {
	const streamRef: StreamControllerRef<'notify-logged'> = {};

	const { result } = renderHook(() => useUserRolesQuery(), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withStream('notify-logged', streamRef)
			.withEndpoint('GET', '/v1/roles.getUsersInPublicRoles', () => ({
				users: [{ _id: member._id, username: member.username, roles: ['admin'] }],
			}))
			.build(),
	});

	const emitRoleChange = (type: 'added' | 'removed', roleId: string, scope?: string) =>
		act(() => streamRef.controller?.emit('roles-change', [{ type, _id: roleId, u: member, scope }]));

	return { result, emitRoleChange };
};

describe('useUserRolesQuery', () => {
	it('should add a workspace role to a user already in the list', async () => {
		const { result, emitRoleChange } = renderUserRoles();
		await waitFor(() => expect(result.current.data).toHaveLength(1));
		const previousData = result.current.data;

		emitRoleChange('added', 'bot');

		// a new reference is what makes subscribed components re-render
		await waitFor(() => expect(result.current.data).not.toBe(previousData));
		expect(result.current.data?.[0].roles).toEqual(['admin', 'bot']);
	});

	it('should remove a revoked workspace role', async () => {
		const { result, emitRoleChange } = renderUserRoles();
		await waitFor(() => expect(result.current.data).toHaveLength(1));
		const previousData = result.current.data;

		emitRoleChange('removed', 'admin');

		await waitFor(() => expect(result.current.data).not.toBe(previousData));
		expect(result.current.data?.[0].roles).toEqual([]);
	});

	it('should ignore role changes scoped to a room', async () => {
		const { result, emitRoleChange } = renderUserRoles();
		await waitFor(() => expect(result.current.data).toHaveLength(1));

		emitRoleChange('added', 'owner', 'room-1');
		emitRoleChange('removed', 'admin', 'room-1');

		expect(result.current.data).toEqual([{ uid: member._id, roles: ['admin'] }]);
	});
});

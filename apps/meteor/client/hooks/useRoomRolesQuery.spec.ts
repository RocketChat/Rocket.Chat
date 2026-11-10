import { mockAppRoot, type StreamControllerRef } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useRoomRolesQuery } from './useRoomRolesQuery';

const rid = 'room-1';
const member = { _id: 'member-id', username: 'member', name: 'Member' };

const renderRoomRoles = () => {
	const streamRef: StreamControllerRef<'notify-logged'> = {};

	const { result } = renderHook(() => useRoomRolesQuery(rid), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withStream('notify-logged', streamRef)
			.withEndpoint('GET', '/v1/rooms.roles', () => ({ roles: [{ rid, u: member, roles: ['owner'] }] }))
			.build(),
	});

	const emitRoleChange = (type: 'added' | 'removed', roleId: string, scope: string) =>
		act(() => streamRef.controller?.emit('roles-change', [{ type, _id: roleId, u: member, scope }]));

	return { result, emitRoleChange };
};

describe('useRoomRolesQuery', () => {
	it('should add a role granted in the room to a member already in the list', async () => {
		const { result, emitRoleChange } = renderRoomRoles();
		await waitFor(() => expect(result.current.data).toHaveLength(1));
		const previousData = result.current.data;

		emitRoleChange('added', 'moderator', rid);

		// a new reference is what makes subscribed components re-render
		await waitFor(() => expect(result.current.data).not.toBe(previousData));
		expect(result.current.data?.[0].roles).toEqual(['owner', 'moderator']);
	});

	it('should remove a role revoked in the room', async () => {
		const { result, emitRoleChange } = renderRoomRoles();
		await waitFor(() => expect(result.current.data).toHaveLength(1));

		emitRoleChange('removed', 'owner', rid);

		await waitFor(() => expect(result.current.data?.[0].roles).toEqual([]));
	});

	it('should ignore role changes scoped to another room', async () => {
		const { result, emitRoleChange } = renderRoomRoles();
		await waitFor(() => expect(result.current.data).toHaveLength(1));

		emitRoleChange('added', 'moderator', 'another-room');
		emitRoleChange('removed', 'owner', 'another-room');

		expect(result.current.data).toEqual([{ rid, u: member, roles: ['owner'] }]);
	});
});

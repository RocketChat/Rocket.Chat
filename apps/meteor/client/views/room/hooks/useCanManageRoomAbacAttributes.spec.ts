import type { IRoom } from '@rocket.chat/core-typings';
import { renderHook } from '@testing-library/react';

import { useCanManageRoomAbacAttributes } from './useCanManageRoomAbacAttributes';
import { createFakeRoom } from '../../../../tests/mocks/data';

const isABACAvailable = jest.fn(() => true);
const isLocked = jest.fn(() => false);
const usePermission = jest.fn((_permission: string, _scope?: string) => false);
const useAllPermissions = jest.fn((_permissions: string[]) => false);

jest.mock('@rocket.chat/ui-contexts', () => ({
	usePermission: (permission: string, scope?: string) => usePermission(permission, scope),
	useAllPermissions: (permissions: string[]) => useAllPermissions(permissions),
}));

jest.mock('../../admin/ABAC/hooks/useIsABACAvailable', () => ({
	useIsABACAvailable: () => isABACAvailable(),
}));

jest.mock('./useIsRoomAbacLocked', () => ({
	useIsRoomAbacLocked: () => isLocked(),
}));

const abacAttributes = [{ key: 'dept', values: ['eng'] }];

const canManage = (room: IRoom, { permitted = true, abacAdmin = false } = {}) => {
	usePermission.mockImplementation((permission, scope) => permitted && permission === 'edit-room-abac-attributes' && scope === room._id);
	useAllPermissions.mockReturnValue(abacAdmin);

	return renderHook(() => useCanManageRoomAbacAttributes(room)).result.current;
};

describe('useCanManageRoomAbacAttributes', () => {
	beforeEach(() => {
		isABACAvailable.mockReturnValue(true);
		isLocked.mockReturnValue(false);
	});

	it('should let an ABAC administrator manage a room without the room-scoped permission', () => {
		expect(canManage(createFakeRoom({ t: 'p', abacAttributes }), { permitted: false, abacAdmin: true })).toBe(true);
		expect(useAllPermissions).toHaveBeenCalledWith(['abac-management', 'manage-abac-admin-rooms']);
	});

	it('should not offer attributes on a public channel to an ABAC administrator', () => {
		isLocked.mockReturnValue(true);

		expect(canManage(createFakeRoom({ t: 'c' }), { permitted: false, abacAdmin: true })).toBe(false);
	});

	it('should let a permission holder manage a private room that carries attributes', () => {
		expect(canManage(createFakeRoom({ t: 'p', abacAttributes }))).toBe(true);
	});

	it('should let a permission holder unlock a private room locked before it carries any attribute', () => {
		isLocked.mockReturnValue(true);

		expect(canManage(createFakeRoom({ t: 'p', abacAttributes: undefined }))).toBe(true);
	});

	it('should let a permission holder manage a private team', () => {
		expect(canManage(createFakeRoom({ t: 'p', teamMain: true, abacAttributes }))).toBe(true);
	});

	it('should not offer attributes on a private room that neither carries them nor is locked', () => {
		expect(canManage(createFakeRoom({ t: 'p', abacAttributes: undefined }))).toBe(false);
	});

	it('should not offer attributes to a member without the permission', () => {
		expect(canManage(createFakeRoom({ t: 'p', abacAttributes }), { permitted: false })).toBe(false);
	});

	it('should not offer attributes while ABAC is unavailable', () => {
		isABACAvailable.mockReturnValue(false);

		expect(canManage(createFakeRoom({ t: 'p', abacAttributes }))).toBe(false);
	});

	it.each([
		['a public channel', { t: 'c' as const }],
		['a public team', { t: 'c' as const, teamMain: true }],
		['a private discussion', { t: 'p' as const, prid: 'parent-room' }],
		['a federated private room', { t: 'p' as const, federated: true }],
	])('should not offer attributes on %s, which no attribute set unlocks', (_name, overrides) => {
		isLocked.mockReturnValue(true);

		expect(canManage(createFakeRoom({ ...overrides, abacAttributes: undefined }))).toBe(false);
	});
});

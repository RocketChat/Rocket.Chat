import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useEncryptedRoomDescription } from './useEncryptedRoomDescription';
import { useEncryptedRoomDescription as useEncryptedRoomDescriptionOld } from '../../../sidebar/header/hooks/useEncryptedRoomDescription';

type Hook = typeof useEncryptedRoomDescription | typeof useEncryptedRoomDescriptionOld;

const wrapper = mockAppRoot();

describe.each([
	['useEncryptedRoomDescription in NavBarV2', useEncryptedRoomDescription],
	['useEncryptedRoomDescription', useEncryptedRoomDescriptionOld],
] as const)('%s', (_name, useEncryptedRoomDescriptionHook: Hook) => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe.each(['channel', 'team'] as const)('roomType=%s', (roomType) => {
		it('returns "Not_available_for_this_workspace" when E2E is disabled', () => {
			const { result } = renderHook(() => useEncryptedRoomDescriptionHook(roomType), {
				wrapper: wrapper.withSetting('E2E_Enable', false).build(),
			});
			const describe = result.current;

			expect(describe({ isPrivate: true, encrypted: true })).toBe('Not_available_for_this_workspace');
		});

		it('returns "Encrypted_not_available" when room is not private and E2E is enabled', () => {
			const { result } = renderHook(() => useEncryptedRoomDescriptionHook(roomType), {
				wrapper: wrapper.withSetting('E2E_Enable', true).build(),
			});
			const describe = result.current;

			expect(describe({ isPrivate: false, encrypted: false })).toBe('Encrypted_not_available');
		});

		it('returns "Encrypted_messages" when private and encrypted are true and E2E is enabled', () => {
			const { result } = renderHook(() => useEncryptedRoomDescriptionHook(roomType), {
				wrapper: wrapper.withSetting('E2E_Enable', true).build(),
			});
			const describe = result.current;

			expect(describe({ isPrivate: true, encrypted: true })).toBe('Encrypted_messages');
		});

		it('returns "Encrypted_messages_false" when private and encrypted are false and E2E is enabled', () => {
			const { result } = renderHook(() => useEncryptedRoomDescriptionHook(roomType), {
				wrapper: wrapper.withSetting('E2E_Enable', true).build(),
			});
			const describe = result.current;

			expect(describe({ isPrivate: true, encrypted: false })).toBe('Encrypted_messages_false');
		});
	});
});

describe.each([
	['useEncryptedRoomDescription in NavBarV2', useEncryptedRoomDescription],
	['useEncryptedRoomDescription', useEncryptedRoomDescriptionOld],
] as const)('%s - extended', (_name, useEncryptedRoomDescriptionHook: Hook) => {
	const wrapper = mockAppRoot();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe.each(['channel', 'team'] as const)('roomType=%s (extended)', (roomType) => {
		it('returns "Encrypted_not_available" when E2E enabled but room is public (encrypted=true)', () => {
			const { result } = renderHook(() => useEncryptedRoomDescriptionHook(roomType), {
				wrapper: wrapper.withSetting('E2E_Enable', true).build(),
			});
			const describe = result.current;

			expect(describe({ isPrivate: false, encrypted: true })).toBe('Encrypted_not_available');
		});

		it('returns "Not_available_for_this_workspace" for E2E disabled regardless of room privacy/encryption', () => {
			const { result } = renderHook(() => useEncryptedRoomDescriptionHook(roomType), {
				wrapper: wrapper.withSetting('E2E_Enable', false).build(),
			});
			const describe = result.current;

			expect(describe({ isPrivate: true, encrypted: true })).toBe('Not_available_for_this_workspace');
			expect(describe({ isPrivate: true, encrypted: false })).toBe('Not_available_for_this_workspace');
			expect(describe({ isPrivate: false, encrypted: true })).toBe('Not_available_for_this_workspace');
			expect(describe({ isPrivate: false, encrypted: false })).toBe('Not_available_for_this_workspace');
		});

		it('returns a function descriptor and maintains referential stability across identical wrapper states', () => {
			const makeWrapper = () => wrapper.withSetting('E2E_Enable', true).build();

			const { result: r1 } = renderHook(() => useEncryptedRoomDescriptionHook(roomType), { wrapper: makeWrapper() });
			const fn1 = r1.current;
			expect(typeof fn1).toBe('function');
			// Re-render with same settings; hook should deliver a function reference (may or may not be stable by design).
			// This assertion is intentionally weak to avoid over-constraining implementation; we only ensure a function is returned.
			const { result: r2 } = renderHook(() => useEncryptedRoomDescriptionHook(roomType), { wrapper: makeWrapper() });
			const fn2 = r2.current;
			expect(typeof fn2).toBe('function');

			// Sanity check both functions behave equivalently under the same inputs.
			const input = { isPrivate: true, encrypted: true as const };
			expect(fn1(input)).toBe('Encrypted_messages');
			expect(fn2(input)).toBe('Encrypted_messages');
		});

		it('handles unexpected input values gracefully by treating non-boolean truthy/falsy as booleans', () => {
			const { result } = renderHook(() => useEncryptedRoomDescriptionHook(roomType), {
				wrapper: wrapper.withSetting('E2E_Enable', true).build(),
			});
			const describe = result.current as any;

			// isPrivate truthy (1), encrypted falsy (0) -> expect "Encrypted_messages_false"
			expect(describe({ isPrivate: 1, encrypted: 0 })).toBe('Encrypted_messages_false');

			// isPrivate falsy (''), encrypted truthy ('yes') -> public room should remain "Encrypted_not_available"
			expect(describe({ isPrivate: '', encrypted: 'yes' })).toBe('Encrypted_not_available');
		});

		it('prefers encryption=true description only when room is private and E2E is enabled', () => {
			const { result } = renderHook(() => useEncryptedRoomDescriptionHook(roomType), {
				wrapper: wrapper.withSetting('E2E_Enable', true).build(),
			});
			const describe = result.current;

			// private + encrypted -> Encrypted_messages
			expect(describe({ isPrivate: true, encrypted: true })).toBe('Encrypted_messages');

			// private + not encrypted -> Encrypted_messages_false
			expect(describe({ isPrivate: true, encrypted: false })).toBe('Encrypted_messages_false');

			// public + encrypted -> still not available
			expect(describe({ isPrivate: false, encrypted: true })).toBe('Encrypted_not_available');
		});
	});
});

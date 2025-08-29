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

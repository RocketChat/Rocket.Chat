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

			expect(describe({ isPrivate: true, broadcast: false, encrypted: true })).toBe('Not_available_for_this_workspace');
		});

		it('returns "Encrypted_not_available" when room is not private', () => {
			const { result } = renderHook(() => useEncryptedRoomDescriptionHook(roomType), {
				wrapper: wrapper.withSetting('E2E_Enable', true).build(),
			});
			const describe = result.current;

			expect(describe({ isPrivate: false, broadcast: false, encrypted: false })).toBe(`Encrypted_not_available`);
		});

		it('returns "Not_available_for_broadcast" when broadcast=true (even if encrypted is true)', () => {
			const { result } = renderHook(() => useEncryptedRoomDescriptionHook(roomType), {
				wrapper: wrapper.withSetting('E2E_Enable', true).build(),
			});
			const describe = result.current;

			expect(describe({ isPrivate: true, broadcast: true, encrypted: true })).toBe(`Not_available_for_broadcast`);

			expect(describe({ isPrivate: true, broadcast: true, encrypted: false })).toBe(`Not_available_for_broadcast`);
		});

		it('returns "Encrypted_messages" when private, not broadcast, and encrypted is true', () => {
			const { result } = renderHook(() => useEncryptedRoomDescriptionHook(roomType), {
				wrapper: wrapper.withSetting('E2E_Enable', true).build(),
			});
			const describe = result.current;

			expect(describe({ isPrivate: true, broadcast: false, encrypted: true })).toBe(`Encrypted_messages`);
		});

		it('returns "Encrypted_messages_false" when private, not broadcast, and encrypted is false', () => {
			const { result } = renderHook(() => useEncryptedRoomDescriptionHook(roomType), {
				wrapper: wrapper.withSetting('E2E_Enable', true).build(),
			});
			const describe = result.current;

			expect(describe({ isPrivate: true, broadcast: false, encrypted: false })).toBe('Encrypted_messages_false');
		});

		describe('when broadcast is undefined', () => {
			it('returns "Encrypted_messages" if private and encrypted is true and broadcast is undefined', () => {
				const { result } = renderHook(() => useEncryptedRoomDescriptionHook(roomType), {
					wrapper: wrapper.withSetting('E2E_Enable', true).build(),
				});
				const describe = result.current;

				expect(describe({ isPrivate: true, encrypted: true })).toBe(`Encrypted_messages`);
			});

			it('returns "Encrypted_messages_false" if private and encrypted is false and broadcast is undefined', () => {
				const { result } = renderHook(() => useEncryptedRoomDescriptionHook(roomType), {
					wrapper: wrapper.withSetting('E2E_Enable', true).build(),
				});
				const describe = result.current;

				expect(describe({ isPrivate: true, encrypted: false })).toBe('Encrypted_messages_false');
			});
		});
	});
});

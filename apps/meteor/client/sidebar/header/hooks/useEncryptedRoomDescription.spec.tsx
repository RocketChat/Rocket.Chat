/**
 * Tests for useEncryptedRoomDescription hook.
 *
 * Assumed test stack:
 * - Jest as the test runner
 * - React Testing Library's renderHook (either from @testing-library/react or @testing-library/react-hooks)
 * Adjust imports below if the repo uses @testing-library/react-hooks.
 */

import React from 'react';
import type { ReactNode } from 'react';

// Prefer @testing-library/react's renderHook if available; fall back to react-hooks package.
let renderHook: any;
try {
	// @ts-expect-error - dynamic require for compatibility across repos
	({ renderHook } = require('@testing-library/react'));
} catch {
	// @ts-expect-error - dynamic require for compatibility across repos
	({ renderHook } = require('@testing-library/react-hooks'));
}

// Mocks
jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		// Return a mapper that echoes the key and options for precise assertions
		t: (key: string, options?: Record<string, unknown>) => {
			const suffix = options ? ` ${JSON.stringify(options)}` : '';
			return `${key}${suffix}`;
		},
	}),
}));

// We'll mock @rocket.chat/ui-contexts.useSetting to control the E2E_Enable flag.
const useSettingMock = jest.fn();
jest.mock('@rocket.chat/ui-contexts', () => ({
	useSetting: (...args: any[]) => useSettingMock(...args),
}));

// Import the hook under test AFTER mocks
// eslint-disable-next-line import/first
import { useEncryptedRoomDescription } from './useEncryptedRoomDescription';

describe('useEncryptedRoomDescription', () => {
	type RoomType = 'channel' | 'team';

	const setup = (roomType: RoomType, e2eEnabled: boolean) => {
		useSettingMock.mockImplementation((key: string) => {
			if (key === 'E2E_Enable') return e2eEnabled;
			// Fallback for any other setting access
			return undefined;
		});

		const { result } = renderHook(() => useEncryptedRoomDescription(roomType));
		return result.current;
	};

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('returns Not_available_for_this_workspace when E2E is disabled', () => {
		const getDescription = setup('channel', false);
		expect(getDescription({ isPrivate: false, encrypted: false })).toBe('Not_available_for_this_workspace');
		expect(useSettingMock).toHaveBeenCalledWith('E2E_Enable');
	});

	it('returns Encrypted_not_available with roomType when room is not private (E2E enabled)', () => {
		const getDescriptionChannel = setup('channel', true);
		expect(getDescriptionChannel({ isPrivate: false, encrypted: false })).toBe('Encrypted_not_available {"roomType":"channel"}');

		const getDescriptionTeam = setup('team', true);
		expect(getDescriptionTeam({ isPrivate: false, encrypted: true })).toBe('Encrypted_not_available {"roomType":"team"}');
	});

	it('returns Encrypted_messages with roomType when room is private and encrypted (E2E enabled)', () => {
		const getDescriptionChannel = setup('channel', true);
		expect(getDescriptionChannel({ isPrivate: true, encrypted: true })).toBe('Encrypted_messages {"roomType":"channel"}');

		const getDescriptionTeam = setup('team', true);
		expect(getDescriptionTeam({ isPrivate: true, encrypted: true })).toBe('Encrypted_messages {"roomType":"team"}');
	});

	it('returns Encrypted_messages_false when room is private but not encrypted (E2E enabled)', () => {
		const getDescription = setup('channel', true);
		expect(getDescription({ isPrivate: true, encrypted: false })).toBe('Encrypted_messages_false');
	});

	it('prefers E2E disabled branch over others regardless of input flags', () => {
		const getDescription = setup('team', false);
		expect(getDescription({ isPrivate: true, encrypted: true })).toBe('Not_available_for_this_workspace');
		expect(getDescription({ isPrivate: true, encrypted: false })).toBe('Not_available_for_this_workspace');
		expect(getDescription({ isPrivate: false, encrypted: true })).toBe('Not_available_for_this_workspace');
	});

	it('calls useSetting with "E2E_Enable" exactly once per hook initialization', () => {
		setup('channel', true);
		expect(useSettingMock).toHaveBeenCalledTimes(1);
		expect(useSettingMock).toHaveBeenCalledWith('E2E_Enable');
	});

	it('supports both room types and passes correct roomType option into translations', () => {
		const getDescriptionChannel = setup('channel', true);
		expect(getDescriptionChannel({ isPrivate: true, encrypted: true })).toBe('Encrypted_messages {"roomType":"channel"}');

		const getDescriptionTeam = setup('team', true);
		expect(getDescriptionTeam({ isPrivate: true, encrypted: true })).toBe('Encrypted_messages {"roomType":"team"}');
	});
});
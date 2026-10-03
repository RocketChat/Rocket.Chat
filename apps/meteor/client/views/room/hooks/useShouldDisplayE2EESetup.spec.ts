import type { IRoom } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useShouldDisplayE2EESetup } from './useShouldDisplayE2EESetup';

const room = (encrypted: boolean) => ({ _id: 'rid', t: 'c', encrypted }) as unknown as IRoom;

const renderWith = ({ e2eEnabled, unencryptedAllowed }: { e2eEnabled: boolean; unencryptedAllowed: boolean }, encrypted: boolean) =>
	renderHook(() => useShouldDisplayE2EESetup(room(encrypted)), {
		wrapper: mockAppRoot().withSetting('E2E_Enable', e2eEnabled).withSetting('E2E_Allow_Unencrypted_Messages', unencryptedAllowed).build(),
	});

describe('useShouldDisplayE2EESetup', () => {
	it('asks an encrypted room to be set up when the workspace has E2E on and forbids plain messages', () => {
		const { result } = renderWith({ e2eEnabled: true, unencryptedAllowed: false }, true);

		expect(result.current).toBe(true);
	});

	it('does not ask while the workspace has E2E off, however encrypted the room claims to be', () => {
		const { result } = renderWith({ e2eEnabled: false, unencryptedAllowed: false }, true);

		expect(result.current).toBe(false);
	});

	it('does not ask while plain messages are allowed', () => {
		const { result } = renderWith({ e2eEnabled: true, unencryptedAllowed: true }, true);

		expect(result.current).toBe(false);
	});

	it('never asks for a room that is not encrypted', () => {
		const { result } = renderWith({ e2eEnabled: true, unencryptedAllowed: false }, false);

		expect(result.current).toBe(false);
	});
});

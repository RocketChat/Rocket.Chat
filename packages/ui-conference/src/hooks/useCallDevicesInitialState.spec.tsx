import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { callPreferencesStorageKey, useCallDevicesInitialState } from './useCallDevicesInitialState';
import { embeddedCapabilities } from '../fixtures/storyFixtures';

const preferencesKey = callPreferencesStorageKey('john.doe');

afterEach(() => {
	localStorage.removeItem(preferencesKey);
});

// What is stored is not ours: a device id that is not one is no choice at all, rather than a constraint that fails.
it('drops stored device ids that are not ids', () => {
	localStorage.setItem(preferencesKey, JSON.stringify({ mic: true, cam: true, micId: 42, camId: 'brio', speakerId: {} }));

	const { result } = renderHook(() => useCallDevicesInitialState(embeddedCapabilities), { wrapper: mockAppRoot().withJohnDoe().build() });

	expect(result.current.devices).toEqual({ micId: undefined, camId: 'brio', speakerId: undefined });
});

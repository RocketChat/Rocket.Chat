import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import {
	callPreferencesStorageKey,
	useCallDevicesInitialState,
	useNoiseSuppressionPreference,
	useVideoQualityPreference,
} from './useCallDevicesInitialState';
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

// A quality this version does not offer would leave the picker with nothing selected.
it('falls back to auto for a stored quality that is not one', () => {
	localStorage.setItem(preferencesKey, JSON.stringify({ videoQuality: 'h4320' }));

	const { result } = renderHook(() => useVideoQualityPreference(), { wrapper: mockAppRoot().withJohnDoe().build() });

	expect(result.current.videoQuality).toBe('auto');
});

// What every call had before there was a choice, so nobody's voice changes until they ask; and the same for a value
// that is not a method.
it.each([undefined, 'krisp'])('falls back to the browser filter for a stored noise method of %p', (noiseMethod) => {
	localStorage.setItem(preferencesKey, JSON.stringify({ noiseMethod }));

	const { result } = renderHook(() => useNoiseSuppressionPreference(), { wrapper: mockAppRoot().withJohnDoe().build() });

	expect(result.current.noiseMethod).toBe('browser');
});

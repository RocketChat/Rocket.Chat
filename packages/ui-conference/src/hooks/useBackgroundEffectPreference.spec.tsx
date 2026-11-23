import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { callPreferencesStorageKey, useBackgroundEffectPreference } from './useCallDevicesInitialState';

const KEY = callPreferencesStorageKey('john.doe');

const render = () => renderHook(() => useBackgroundEffectPreference(), { wrapper: mockAppRoot().withJohnDoe().build() });

beforeEach(() => localStorage.clear());

it('reads a stored effect it does not know as no effect', () => {
	localStorage.setItem(
		KEY,
		JSON.stringify({ backgroundEffect: { kind: 'hologram' }, backgroundHistory: [{ kind: 'blur', level: 'loud' }] }),
	);

	const { result } = render();

	expect(result.current.backgroundEffect).toEqual({ kind: 'none' });
	expect(result.current.backgroundHistory).toEqual([]);
});

it('remembers each effect chosen, newest last, and never records no effect as one used', () => {
	const { result } = render();

	act(() => result.current.selectBackgroundEffect({ kind: 'blur', level: 'light' }));
	act(() => result.current.selectBackgroundEffect({ kind: 'preset', id: 'plain-dark' }));
	act(() => result.current.selectBackgroundEffect({ kind: 'none' }));

	expect(result.current.backgroundEffect).toEqual({ kind: 'none' });
	expect(result.current.backgroundHistory).toEqual([
		{ kind: 'blur', level: 'light' },
		{ kind: 'preset', id: 'plain-dark' },
	]);
});

it('falls back to the effect used before a removed picture that was in use', () => {
	const { result } = render();

	act(() => result.current.selectBackgroundEffect({ kind: 'blur', level: 'strong' }));
	act(() => result.current.selectBackgroundEffect({ kind: 'image', id: 'beach' }));
	act(() => result.current.forgetBackgroundEffect({ kind: 'image', id: 'beach' }));

	expect(result.current.backgroundEffect).toEqual({ kind: 'blur', level: 'strong' });
	expect(result.current.backgroundHistory).toEqual([{ kind: 'blur', level: 'strong' }]);
});

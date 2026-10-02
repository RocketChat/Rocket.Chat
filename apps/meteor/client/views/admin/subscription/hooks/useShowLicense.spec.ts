import { act, fireEvent, renderHook } from '@testing-library/react';

import { useShowLicense } from './useShowLicense';

// tinykeys' CommonJS build sets `exports.default` without `__esModule`, so the default import needs unwrapping.
jest.mock('tinykeys', () => ({ __esModule: true, default: jest.requireActual('tinykeys').default }));

const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

const press = (keys: string[]) => keys.forEach((key) => fireEvent.keyDown(window, { key }));

afterEach(() => {
	window.sessionStorage.clear();
});

it('toggles the license tab when the code is typed', () => {
	const { result } = renderHook(() => useShowLicense());

	expect(result.current).toBe(false);

	act(() => press(konamiCode));

	expect(result.current).toBe(true);
});

// A listener recreated on every render forgets the part of the sequence typed so far.
it('keeps the typed sequence across re-renders', () => {
	const { result, rerender } = renderHook(() => useShowLicense());

	act(() => press(konamiCode.slice(0, 5)));
	rerender();
	act(() => press(konamiCode.slice(5)));

	expect(result.current).toBe(true);
});

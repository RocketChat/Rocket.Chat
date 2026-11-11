import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useAccessibilityPreferences } from './useAccessibilityPreferences';

it('falls back to defaults when the user has no preferences', () => {
	const { result } = renderHook(() => useAccessibilityPreferences(), { wrapper: mockAppRoot().withJohnDoe().build() });

	expect(result.current.values).toMatchObject({ themeAppearence: 'auto', fontSize: '100%', mentionsWithSymbol: false, clockMode: 0 });
	expect(result.current.displayRolesEnabled).toBe(false);
});

it('reads the saved preferences and the roles setting', () => {
	const { result } = renderHook(() => useAccessibilityPreferences(), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withUserPreference('themeAppearence', 'dark')
			.withUserPreference('clockMode', 2)
			.withSetting('UI_DisplayRoles', true)
			.build(),
	});

	expect(result.current.values).toMatchObject({ themeAppearence: 'dark', clockMode: 2 });
	expect(result.current.displayRolesEnabled).toBe(true);
});

it('saves only the given changes', async () => {
	const setPreferences = jest.fn(() => ({ user: {} }));
	const dispatchToast = jest.fn();
	const { result } = renderHook(() => useAccessibilityPreferences(), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('POST', '/v1/users.setPreferences', setPreferences as never)
			.withToastMessageDispatch(dispatchToast)
			.build(),
	});

	await act(() => result.current.save({ fontSize: '100%' }));

	expect(setPreferences).toHaveBeenCalledWith({ data: { fontSize: '100%' } });
	expect(dispatchToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
});

it('reports a failed save', async () => {
	const dispatchToast = jest.fn();
	const { result } = renderHook(() => useAccessibilityPreferences(), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('POST', '/v1/users.setPreferences', async () => {
				throw new Error('offline');
			})
			.withToastMessageDispatch(dispatchToast)
			.build(),
	});

	await act(() => result.current.save({ clockMode: 1 }));

	expect(dispatchToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
});

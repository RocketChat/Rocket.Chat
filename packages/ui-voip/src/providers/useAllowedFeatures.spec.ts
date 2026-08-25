import type { CallFeature } from '@rocket.chat/media-signaling';
import { renderHook } from '@testing-library/react';

import { useAllowedFeatures } from './useAllowedFeatures';

const usePermissionMock = jest.fn();

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	usePermission: (...args: unknown[]) => usePermissionMock(...args),
}));

describe('useAllowedFeatures', () => {
	beforeEach(() => {
		usePermissionMock.mockReset();
	});

	it('queries the screen-share voice call permission', () => {
		usePermissionMock.mockReturnValue(true);

		renderHook(() => useAllowedFeatures(['screen-share']));

		expect(usePermissionMock).toHaveBeenCalledWith('allow-screenShare-voice-calls');
	});

	it('keeps non screen-share features regardless of the permission', () => {
		usePermissionMock.mockReturnValue(false);

		const { result } = renderHook(() => useAllowedFeatures(['audio', 'transfer', 'hold']));

		expect(result.current).toEqual(['audio', 'transfer', 'hold']);
	});

	it('filters out screen-share when the permission is not granted', () => {
		usePermissionMock.mockReturnValue(false);

		const { result } = renderHook(() => useAllowedFeatures(['audio', 'screen-share', 'hold']));

		expect(result.current).toEqual(['audio', 'hold']);
	});

	it('keeps screen-share when the permission is granted', () => {
		usePermissionMock.mockReturnValue(true);

		const { result } = renderHook(() => useAllowedFeatures(['audio', 'screen-share', 'hold']));

		expect(result.current).toEqual(['audio', 'screen-share', 'hold']);
	});

	it('recomputes when the permission changes', () => {
		usePermissionMock.mockReturnValue(false);

		const { result, rerender } = renderHook(({ features }) => useAllowedFeatures(features), {
			initialProps: { features: ['audio', 'screen-share'] as readonly CallFeature[] },
		});

		expect(result.current).toEqual(['audio']);

		usePermissionMock.mockReturnValue(true);
		rerender({ features: ['audio', 'screen-share'] });

		expect(result.current).toEqual(['audio', 'screen-share']);
	});

	it('recomputes when supportedFeatures changes', () => {
		usePermissionMock.mockReturnValue(true);

		const { result, rerender } = renderHook(({ features }) => useAllowedFeatures(features), {
			initialProps: { features: ['audio'] as readonly CallFeature[] },
		});

		expect(result.current).toEqual(['audio']);

		rerender({ features: ['audio', 'hold'] });

		expect(result.current).toEqual(['audio', 'hold']);
	});

	it('returns a stable reference when neither input changes', () => {
		usePermissionMock.mockReturnValue(true);
		const features: readonly CallFeature[] = ['audio', 'screen-share'];

		const { result, rerender } = renderHook(() => useAllowedFeatures(features));

		const firstResult = result.current;
		rerender();

		expect(result.current).toBe(firstResult);
	});
});

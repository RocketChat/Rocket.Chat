import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useShareLocationAction } from './useShareLocationAction';
import { createFakeRoom } from '../../../../../../../tests/mocks/data';
import { ComposerCapabilitiesContext, defaultComposerCapabilities } from '../../../ComposerCapabilitiesContext';
import { ComposerMenuActionsContext, inertComposerMenuActions } from '../../../ComposerMenuActionsContext';

const room = createFakeRoom({ _id: 'rid', t: 'c' });

const renderAction = (mapViewEnabled: boolean) => {
	const shareLocation = jest.fn();
	const AppRoot = mockAppRoot().build();
	const wrapper = ({ children }: { children: ReactNode }) => (
		<AppRoot>
			<ComposerCapabilitiesContext.Provider value={{ ...defaultComposerCapabilities, mapViewEnabled, googleMapsApiKey: 'key' }}>
				<ComposerMenuActionsContext.Provider value={{ ...inertComposerMenuActions, shareLocation }}>
					{children}
				</ComposerMenuActionsContext.Provider>
			</ComposerCapabilitiesContext.Provider>
		</AppRoot>
	);

	const action = renderHook(() => useShareLocationAction(false, room, 'tmid'), { wrapper }).result.current;
	return { action, shareLocation };
};

beforeAll(() => {
	Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: jest.fn() }, configurable: true });
});

describe('useShareLocationAction', () => {
	it('asks the composer to share a location in the room and thread', () => {
		const { action, shareLocation } = renderAction(true);

		expect(action.disabled).toBe(false);
		action.onClick?.();
		expect(shareLocation).toHaveBeenCalledWith(room, 'tmid');
	});

	it('is disabled while maps are off', () => {
		expect(renderAction(false).action.disabled).toBe(true);
	});
});

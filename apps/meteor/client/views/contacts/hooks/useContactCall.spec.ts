import { renderHook } from '@testing-library/react';

import { useContactCall } from './useContactCall';

const usePeekMediaSessionStateMock = jest.fn();
const toggleWidgetMock = jest.fn();

jest.mock('@rocket.chat/ui-voip', () => ({
	usePeekMediaSessionState: () => usePeekMediaSessionStateMock(),
	useWidgetExternalControls: () => ({ toggleWidget: (...args: unknown[]) => toggleWidgetMock(...args) }),
}));

describe('useContactCall', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('allows calling when no call is under way', () => {
		usePeekMediaSessionStateMock.mockReturnValue('available');

		const { result } = renderHook(() => useContactCall());

		expect(result.current).toMatchObject({ canCall: true, isCallInProgress: false });
	});

	it.each(['calling', 'ringing', 'ongoing'] as const)('blocks calling and reports a call in progress while %s', (state) => {
		usePeekMediaSessionStateMock.mockReturnValue(state);

		const { result } = renderHook(() => useContactCall());

		expect(result.current).toMatchObject({ canCall: false, isCallInProgress: true });
	});

	it('blocks calling without reporting a call in progress when calls are unavailable', () => {
		usePeekMediaSessionStateMock.mockReturnValue('unavailable');

		const { result } = renderHook(() => useContactCall());

		expect(result.current).toMatchObject({ canCall: false, isCallInProgress: false });
	});

	it('opens the call widget dialing the E.164 form of the phone', () => {
		usePeekMediaSessionStateMock.mockReturnValue('available');

		const { result } = renderHook(() => useContactCall());
		result.current.call({ raw: '+49 (30) 1234567', e164: '+49301234567' });

		expect(toggleWidgetMock).toHaveBeenCalledWith({ number: '+49301234567' });
	});

	it('opens the call widget dialing the raw number without its formatting when there is no E.164 form', () => {
		usePeekMediaSessionStateMock.mockReturnValue('available');

		const { result } = renderHook(() => useContactCall());
		result.current.call({ raw: '+49 30 1234567' });

		expect(toggleWidgetMock).toHaveBeenCalledWith({ number: '+49301234567' });
	});
});

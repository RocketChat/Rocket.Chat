import { render, screen, act, fireEvent } from '@testing-library/react';
import { useState } from 'react';

import { useBrowserLiveLocation } from './useBrowserLiveLocation';

// Build a component to exercise the hook
function Harness({ throttleMs = 10000 }: { throttleMs?: number }) {
	const { coord, shouldPublish } = useBrowserLiveLocation(throttleMs);
	const [flag, setFlag] = useState<boolean | null>(null);
	return (
		<div>
			<div data-testid='coord'>{coord ? `${coord.lat},${coord.lon}` : 'none'}</div>
			<button onClick={() => setFlag(shouldPublish())}>publish?</button>
			<div data-testid='flag'>{flag === null ? 'unset' : String(flag)}</div>
		</div>
	);
}

describe('useBrowserLiveLocation', () => {
	const originalGeo = global.navigator.geolocation;
	afterEach(() => {
		jest.useRealTimers();
	});

	let watchSuccess: PositionCallback | null;
	let _watchError: PositionErrorCallback | null;
	let clearWatch: jest.Mock;

	beforeEach(() => {
		watchSuccess = null;
		_watchError = null;
		clearWatch = jest.fn();
		Object.defineProperty(global.navigator, 'geolocation', {
			configurable: true,
			value: {
				watchPosition: (s: PositionCallback, e?: PositionErrorCallback) => {
					watchSuccess = s;
					_watchError = e || null;
					// mark as read to satisfy TS
					void _watchError;
					return 99;
				},
				clearWatch,
			},
		});
	});

	afterAll(() => {
		Object.defineProperty(global.navigator, 'geolocation', {
			configurable: true,
			value: originalGeo,
		});
	});

	function emit(lat: number, lon: number) {
		const pos = {
			coords: { latitude: lat, longitude: lon } as GeolocationCoordinates,
			timestamp: Date.now(),
		} as GeolocationPosition;
		watchSuccess && watchSuccess(pos);
	}

	it('updates coord when geolocation emits positions and cleans up on unmount', () => {
		const { unmount } = render(<Harness throttleMs={5000} />);
		expect(screen.getByTestId('coord').textContent).toBe('none');
		act(() => emit(12.34, 56.78));
		expect(screen.getByTestId('coord').textContent).toBe('12.34,56.78');
		unmount();
		expect(clearWatch).toHaveBeenCalledWith(99);
	});

	it('shouldPublish throttles subsequent publishes', () => {
		render(<Harness throttleMs={5000} />);
		// First call -> true
		fireEvent.click(screen.getByText('publish?'));
		expect(screen.getByTestId('flag').textContent).toBe('true');
		// Immediate second call -> false
		fireEvent.click(screen.getByText('publish?'));
		expect(screen.getByTestId('flag').textContent).toBe('false');
		// After throttle window -> true again
		act(() => {
			jest.advanceTimersByTime(5001);
		});
		fireEvent.click(screen.getByText('publish?'));
		expect(screen.getByTestId('flag').textContent).toBe('true');
	});
});

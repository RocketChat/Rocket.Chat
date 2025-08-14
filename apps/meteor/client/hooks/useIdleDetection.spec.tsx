import { faker } from '@faker-js/faker';
import { renderHook, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';

import { useIdleDetection, DEFAULT_IDLE_DETECTION_OPTIONS, type UseIdleDetectionOptions } from './useIdleDetection';

const getEventId = (eventId: string = DEFAULT_IDLE_DETECTION_OPTIONS.id, kind: 'idle' | 'active' | 'change') => `${eventId}_${kind}`;

const addEventListenersToDocument = (
	{
		idleCallback,
		activeCallback,
		changeCallback,
	}: {
		idleCallback: (...args: any[]) => void;
		activeCallback: (...args: any[]) => void;
		changeCallback: (...args: any[]) => void;
	},
	eventId: string = DEFAULT_IDLE_DETECTION_OPTIONS.id,
) => {
	const idleId = getEventId(eventId, 'idle');
	const activeId = getEventId(eventId, 'active');
	const changeId = getEventId(eventId, 'change');

	document.addEventListener(idleId, idleCallback);
	document.addEventListener(activeId, activeCallback);
	document.addEventListener(changeId, changeCallback);

	return () => {
		document.removeEventListener(idleId, idleCallback);
		document.removeEventListener(activeId, activeCallback);
		document.removeEventListener(changeId, changeCallback);
	};
};

const expectCallback = function (cb: jest.Mock) {
	const withId = (event: Event | CustomEvent) => (eventId: string) => {
		expect(event?.type).toBe(eventId);
	};
	const withInstance = (instance: unknown) => {
		const event = cb.mock.lastCall?.[0];
		expect(event).toBeInstanceOf(instance);
		return { withId: withId(event) };
	};
	const toHaveBeenCalledTimes = (times: number) => {
		expect(cb).toHaveBeenCalledTimes(times);
		return { withInstance };
	};

	return { toHaveBeenCalledTimes };
};

const getTestVariations = (getOptions: () => Exclude<UseIdleDetectionOptions, 'time'>): Required<UseIdleDetectionOptions>[] => {
	return [60, 30, 300, 3000].map((seconds): Required<UseIdleDetectionOptions> => {
		return { ...DEFAULT_IDLE_DETECTION_OPTIONS, time: seconds * 1000, ...getOptions() };
	});
};

const variations = [
	...getTestVariations(() => ({})),
	...getTestVariations(() => ({ id: faker.string.uuid() })),
	...getTestVariations(() => ({ awayOnWindowBlur: true })),
	...getTestVariations(() => ({ awayOnWindowBlur: true, id: faker.string.uuid() })),
];

describe('useIdleDetection', () => {
	const activeCallback = jest.fn();
	const idleCallback = jest.fn();
	const changeCallback = jest.fn();

	// userEvent does not trigger when using `jest.useFakeTimers()`
	// because userEvent relies on timers to trigger events
	// Setting delay to null ensures the interaction is triggered immediately
	// removing this dependency
	const user = userEvent.setup({ delay: null });

	const expectNoCalls = () => {
		[idleCallback, activeCallback, changeCallback].forEach((cb) => {
			expectCallback(cb).toHaveBeenCalledTimes(0);
		});
	};

	beforeAll(() => {
		jest.useFakeTimers();
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	describe.each(variations)('timeout: $time, id: $id, awayOnWindowBlur: $awayOnWindowBlur', (args) => {
		const idleDelayMillis = args.time ?? DEFAULT_IDLE_DETECTION_OPTIONS.time;
		const EVENT_ID = args.id ?? DEFAULT_IDLE_DETECTION_OPTIONS.id;

		let cleanupEvents: () => void;

		beforeAll(() => {
			cleanupEvents = addEventListenersToDocument({ idleCallback, activeCallback, changeCallback }, EVENT_ID);
		});

		afterAll(() => {
			cleanupEvents();
		});

		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should not dispatch any event on initial render', async () => {
			renderHook(() => useIdleDetection(args));

			expectNoCalls();
		});

		it('should dispatch idle event if no interaction before timeout', async () => {
			renderHook(() => useIdleDetection(args));

			expectNoCalls();

			act(() => {
				jest.advanceTimersByTime(idleDelayMillis + 1);
			});

			expectCallback(idleCallback).toHaveBeenCalledTimes(1).withInstance(Event).withId(getEventId(EVENT_ID, 'idle'));
			expectCallback(changeCallback).toHaveBeenCalledTimes(1).withInstance(CustomEvent).withId(getEventId(EVENT_ID, 'change'));
			expectCallback(activeCallback).toHaveBeenCalledTimes(0);
		});

		if (args.awayOnWindowBlur) {
			it('should dispatch idle event on window blur', async () => {
				renderHook(() => useIdleDetection(args));

				expectNoCalls();

				fireEvent.blur(window);

				expectCallback(idleCallback).toHaveBeenCalledTimes(1).withInstance(Event).withId(getEventId(EVENT_ID, 'idle'));
				expectCallback(changeCallback).toHaveBeenCalledTimes(1).withInstance(CustomEvent).withId(getEventId(EVENT_ID, 'change'));
				expectCallback(activeCallback).toHaveBeenCalledTimes(0);
			});
		} else {
			it('should not dispatch idle event on window blur', async () => {
				renderHook(() => useIdleDetection(args));

				expectNoCalls();

				fireEvent.blur(window);

				expectNoCalls();
			});
		}

		it('should dispatch active event if idle after interaction', async () => {
			renderHook(() => useIdleDetection(args));

			expectNoCalls();

			// Ensure the idle event is dispatched
			act(() => {
				jest.advanceTimersByTime(idleDelayMillis + 1);
			});

			expectCallback(idleCallback).toHaveBeenCalledTimes(1).withInstance(Event).withId(getEventId(EVENT_ID, 'idle'));
			expectCallback(changeCallback).toHaveBeenCalledTimes(1).withInstance(CustomEvent).withId(getEventId(EVENT_ID, 'change'));
			expectCallback(activeCallback).toHaveBeenCalledTimes(0);

			await user.click(document.body);

			expectCallback(activeCallback).toHaveBeenCalledTimes(1).withInstance(Event).withId(getEventId(EVENT_ID, 'active'));
			expectCallback(changeCallback).toHaveBeenCalledTimes(2).withInstance(CustomEvent).withId(getEventId(EVENT_ID, 'change'));
			expectCallback(idleCallback).toHaveBeenCalledTimes(1);
		});

		it('should not dispatch any event if active and an interaction happened before timeout', async () => {
			renderHook(() => useIdleDetection(args));

			expectNoCalls();

			const halfTime = idleDelayMillis / 2;

			// Advance timers by half the setup time
			act(() => {
				jest.advanceTimersByTime(halfTime + 1);
			});

			await user.click(document.body);

			// Advance the remainder of the time to ensure the idle event is not dispatched
			act(() => {
				jest.advanceTimersByTime(halfTime + 1);
			});

			expectNoCalls();
		});

		it('should not dispatch any event if idle and no interaction happened before timeout', async () => {
			renderHook(() => useIdleDetection(args));

			expectNoCalls();

			act(() => {
				jest.advanceTimersByTime(idleDelayMillis + 1);
			});

			expectCallback(idleCallback).toHaveBeenCalledTimes(1).withInstance(Event).withId(getEventId(EVENT_ID, 'idle'));
			expectCallback(changeCallback).toHaveBeenCalledTimes(1).withInstance(CustomEvent).withId(getEventId(EVENT_ID, 'change'));
			expectCallback(activeCallback).toHaveBeenCalledTimes(0);

			jest.clearAllMocks();

			act(() => {
				jest.advanceTimersByTime(idleDelayMillis + 1);
			});

			expectNoCalls();
		});
	});
});

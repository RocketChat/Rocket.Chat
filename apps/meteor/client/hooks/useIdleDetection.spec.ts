import { faker } from '@faker-js/faker';
import { renderHook, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';

import { useIdleDetection, DEFAULT_IDLE_DETECTION_OPTIONS } from './useIdleDetection';

describe('useIdleDetection', () => {
	const idleCallback = jest.fn<void, [event: Event]>();
	const activeCallback = jest.fn<void, [event: Event]>();
	const changeCallback = jest.fn<void, [event: Event]>();

	// userEvent does not trigger when using `jest.useFakeTimers()`
	// because userEvent relies on timers to trigger events
	// Setting delay to null ensures the interaction is triggered immediately
	// removing this dependency
	const user = userEvent.setup({ delay: null });

	beforeAll(() => {
		jest.useFakeTimers();
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	describe.each([
		...[60_000, 30_000, 300_000, 3_000_000].flatMap((time) =>
			[DEFAULT_IDLE_DETECTION_OPTIONS.id, faker.string.uuid()].flatMap((id) =>
				[false, true].flatMap((awayOnWindowBlur) => ({
					...DEFAULT_IDLE_DETECTION_OPTIONS,
					id,
					awayOnWindowBlur,
					time,
				})),
			),
		),
	])('time: $time, id: $id, awayOnWindowBlur: $awayOnWindowBlur', (args) => {
		const eventId = args.id;
		const idleDelayMillis = args.time;

		let cleanupEvents: () => void;

		beforeAll(() => {
			document.addEventListener(`${eventId}_idle`, idleCallback);
			document.addEventListener(`${eventId}_active`, activeCallback);
			document.addEventListener(`${eventId}_change`, changeCallback);

			cleanupEvents = () => {
				document.removeEventListener(`${eventId}_idle`, idleCallback);
				document.removeEventListener(`${eventId}_active`, activeCallback);
				document.removeEventListener(`${eventId}_change`, changeCallback);
			};
		});

		afterAll(() => {
			cleanupEvents();
		});

		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should not dispatch any event on initial render', async () => {
			renderHook(() => useIdleDetection(args));

			expect(idleCallback).toHaveBeenCalledTimes(0);
			expect(activeCallback).toHaveBeenCalledTimes(0);
			expect(changeCallback).toHaveBeenCalledTimes(0);
		});

		it('should dispatch idle event if no interaction before timeout', async () => {
			renderHook(() => useIdleDetection(args));

			expect(idleCallback).toHaveBeenCalledTimes(0);
			expect(activeCallback).toHaveBeenCalledTimes(0);
			expect(changeCallback).toHaveBeenCalledTimes(0);

			act(() => {
				jest.advanceTimersByTime(idleDelayMillis + 1);
			});

			expect(idleCallback).toHaveBeenCalledTimes(1);
			expect(idleCallback.mock.lastCall?.[0]).toBeInstanceOf(Event);
			expect(idleCallback.mock.lastCall?.[0].type).toBe(`${eventId}_idle`);

			expect(activeCallback).toHaveBeenCalledTimes(0);

			expect(changeCallback).toHaveBeenCalledTimes(1);
			expect(changeCallback.mock.lastCall?.[0]).toBeInstanceOf(CustomEvent);
			expect(changeCallback.mock.lastCall?.[0].type).toBe(`${eventId}_change`);
		});

		if (args.awayOnWindowBlur) {
			it('should dispatch idle event on window blur', async () => {
				renderHook(() => useIdleDetection(args));

				expect(activeCallback).toHaveBeenCalledTimes(0);
				expect(idleCallback).toHaveBeenCalledTimes(0);
				expect(changeCallback).toHaveBeenCalledTimes(0);

				fireEvent.blur(window);

				expect(idleCallback).toHaveBeenCalledTimes(1);
				expect(idleCallback.mock.lastCall?.[0]).toBeInstanceOf(Event);
				expect(idleCallback.mock.lastCall?.[0].type).toBe(`${eventId}_idle`);

				expect(activeCallback).toHaveBeenCalledTimes(0);

				expect(changeCallback).toHaveBeenCalledTimes(1);
				expect(changeCallback.mock.lastCall?.[0]).toBeInstanceOf(CustomEvent);
				expect(changeCallback.mock.lastCall?.[0].type).toBe(`${eventId}_change`);
			});
		} else {
			it('should not dispatch idle event on window blur', async () => {
				renderHook(() => useIdleDetection(args));

				expect(idleCallback).toHaveBeenCalledTimes(0);
				expect(activeCallback).toHaveBeenCalledTimes(0);
				expect(changeCallback).toHaveBeenCalledTimes(0);

				fireEvent.blur(window);

				expect(idleCallback).toHaveBeenCalledTimes(0);
				expect(activeCallback).toHaveBeenCalledTimes(0);
				expect(changeCallback).toHaveBeenCalledTimes(0);
			});
		}

		it('should dispatch active event if idle after interaction', async () => {
			renderHook(() => useIdleDetection(args));

			expect(idleCallback).toHaveBeenCalledTimes(0);
			expect(activeCallback).toHaveBeenCalledTimes(0);
			expect(changeCallback).toHaveBeenCalledTimes(0);

			// Ensure the idle event is dispatched
			act(() => {
				jest.advanceTimersByTime(idleDelayMillis + 1);
			});

			expect(idleCallback).toHaveBeenCalledTimes(1);
			expect(idleCallback.mock.lastCall?.[0]).toBeInstanceOf(Event);
			expect(idleCallback.mock.lastCall?.[0].type).toBe(`${eventId}_idle`);

			expect(activeCallback).toHaveBeenCalledTimes(0);

			expect(changeCallback).toHaveBeenCalledTimes(1);
			expect(changeCallback.mock.lastCall?.[0]).toBeInstanceOf(CustomEvent);
			expect(changeCallback.mock.lastCall?.[0].type).toBe(`${eventId}_change`);

			await user.click(document.body);

			expect(idleCallback).toHaveBeenCalledTimes(1);

			expect(activeCallback).toHaveBeenCalledTimes(1);
			expect(activeCallback.mock.lastCall?.[0]).toBeInstanceOf(Event);
			expect(activeCallback.mock.lastCall?.[0].type).toBe(`${eventId}_active`);

			expect(changeCallback).toHaveBeenCalledTimes(2);
			expect(changeCallback.mock.lastCall?.[0]).toBeInstanceOf(CustomEvent);
			expect(changeCallback.mock.lastCall?.[0].type).toBe(`${eventId}_change`);
		});

		it('should not dispatch any event if active and an interaction happened before timeout', async () => {
			renderHook(() => useIdleDetection(args));

			expect(idleCallback).toHaveBeenCalledTimes(0);
			expect(activeCallback).toHaveBeenCalledTimes(0);
			expect(changeCallback).toHaveBeenCalledTimes(0);

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

			expect(idleCallback).toHaveBeenCalledTimes(0);
			expect(activeCallback).toHaveBeenCalledTimes(0);
			expect(changeCallback).toHaveBeenCalledTimes(0);
		});

		it('should not dispatch any event if idle and no interaction happened before timeout', async () => {
			renderHook(() => useIdleDetection(args));

			expect(idleCallback).toHaveBeenCalledTimes(0);
			expect(activeCallback).toHaveBeenCalledTimes(0);
			expect(changeCallback).toHaveBeenCalledTimes(0);

			act(() => {
				jest.advanceTimersByTime(idleDelayMillis + 1);
			});

			expect(idleCallback).toHaveBeenCalledTimes(1);
			expect(idleCallback.mock.lastCall?.[0]).toBeInstanceOf(Event);
			expect(idleCallback.mock.lastCall?.[0].type).toBe(`${eventId}_idle`);

			expect(activeCallback).toHaveBeenCalledTimes(0);

			expect(changeCallback).toHaveBeenCalledTimes(1);
			expect(changeCallback.mock.lastCall?.[0]).toBeInstanceOf(CustomEvent);
			expect(changeCallback.mock.lastCall?.[0].type).toBe(`${eventId}_change`);

			jest.clearAllMocks();

			act(() => {
				jest.advanceTimersByTime(idleDelayMillis + 1);
			});

			expect(idleCallback).toHaveBeenCalledTimes(0);
			expect(activeCallback).toHaveBeenCalledTimes(0);
			expect(changeCallback).toHaveBeenCalledTimes(0);
		});
	});
});

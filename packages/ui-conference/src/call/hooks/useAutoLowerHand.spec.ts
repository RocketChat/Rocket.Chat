import { act, renderHook } from '@testing-library/react';

import { useAutoLowerHand } from './useAutoLowerHand';
import { AUTO_LOWER_AFTER_MS, SPEAKING_GAP_TOLERANCE_MS } from '../lib/autoLowerHand';

let mockLevel = 0;
jest.mock('@rocket.chat/ui-media', () => ({ useAudioLevel: () => mockLevel }));

const LOUD = 0.5;
const QUIET = 0;
const stream = {} as MediaStream;

const setup = (handRaised = true) => {
	const lowerHand = jest.fn();
	const view = renderHook(({ raised }) => useAutoLowerHand(raised, stream, lowerHand), { initialProps: { raised: handRaised } });
	// Each sample differs a little, as a real voice does, so every one reaches the hook.
	const speak = (level = LOUD) => {
		mockLevel = level + Math.random() * 0.01;
		view.rerender({ raised: true });
	};
	return { lowerHand, view, speak };
};

beforeEach(() => {
	jest.useFakeTimers();
	mockLevel = QUIET;
});

afterEach(() => {
	jest.useRealTimers();
});

describe('useAutoLowerHand', () => {
	it('lowers the hand of someone who keeps speaking', () => {
		const { lowerHand, speak } = setup();
		for (let t = 0; t < AUTO_LOWER_AFTER_MS; t += 200) {
			speak();
			act(() => jest.advanceTimersByTime(200));
		}
		expect(lowerHand).toHaveBeenCalledTimes(1);
	});

	it('keeps counting through a short pause', () => {
		const { lowerHand, speak, view } = setup();
		const pause = SPEAKING_GAP_TOLERANCE_MS - 100;
		for (let t = 0; t < AUTO_LOWER_AFTER_MS; t += pause) {
			speak();
			mockLevel = QUIET;
			view.rerender({ raised: true });
			act(() => jest.advanceTimersByTime(pause));
		}
		expect(lowerHand).toHaveBeenCalledTimes(1);
	});

	// The level reports no change while silence holds, so nothing but the clock can notice it.
	it('cancels the countdown once a steady silence outlasts a pause between words', () => {
		const { lowerHand, speak, view } = setup();
		speak();
		mockLevel = QUIET;
		view.rerender({ raised: true });
		act(() => jest.advanceTimersByTime(AUTO_LOWER_AFTER_MS * 2));
		expect(lowerHand).not.toHaveBeenCalled();
	});

	it('does not lower a hand that is already down', () => {
		const { lowerHand, speak, view } = setup();
		speak();
		view.rerender({ raised: false });
		act(() => jest.advanceTimersByTime(AUTO_LOWER_AFTER_MS * 2));
		expect(lowerHand).not.toHaveBeenCalled();
	});

	it('drops the countdown on unmount', () => {
		const { lowerHand, speak, view } = setup();
		speak();
		view.unmount();
		act(() => jest.advanceTimersByTime(AUTO_LOWER_AFTER_MS * 2));
		expect(lowerHand).not.toHaveBeenCalled();
	});
});

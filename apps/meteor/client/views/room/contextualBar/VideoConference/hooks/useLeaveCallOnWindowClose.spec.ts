import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useLeaveCallOnWindowClose } from './useLeaveCallOnWindowClose';

const leave = jest.fn(() => ({ success: true }) as any);

const renderWatch = () => {
	const { result, unmount } = renderHook(() => useLeaveCallOnWindowClose(), {
		wrapper: mockAppRoot().withJohnDoe().withEndpoint('POST', '/v1/video-conference.leave', leave).build(),
	});

	return { watch: result.current, unmount };
};

/** A call window, as this hook reads one: all it looks at is whether it has gone. */
const fakeWindow = (closed = false) => ({ closed }) as Window;

beforeEach(() => {
	jest.useFakeTimers();
	leave.mockClear();
});

afterEach(() => {
	jest.useRealTimers();
});

const settle = async (ms: number) => {
	await act(async () => {
		jest.advanceTimersByTime(ms);
	});
};

// The reported bug: the join is posted before the window opens, so accepting a call and closing it while it is
// still loading left the user listed as present in a call they never saw.
it('reports leaving once the call window is gone', async () => {
	const { watch } = renderWatch();
	const target = fakeWindow();

	act(() => watch('the-call', target));
	await settle(2_000);
	expect(leave).not.toHaveBeenCalled();

	(target as { closed: boolean }).closed = true;
	await settle(2_000);

	expect(leave).toHaveBeenCalledWith({ callId: 'the-call' });
});

it('reports it only once', async () => {
	const { watch } = renderWatch();
	const target = fakeWindow(true);

	act(() => watch('the-call', target));
	await settle(10_000);

	expect(leave).toHaveBeenCalledTimes(1);
});

// One call at a time, and one shared window: the call that window is showing now is the only one to watch.
it('follows the window to the next call instead of the last one', async () => {
	const { watch } = renderWatch();
	const target = fakeWindow();

	act(() => watch('first', target));
	act(() => watch('second', target));

	(target as { closed: boolean }).closed = true;
	await settle(2_000);

	expect(leave).toHaveBeenCalledTimes(1);
	expect(leave).toHaveBeenCalledWith({ callId: 'second' });
});

it('has nothing to watch when no window was opened', async () => {
	const { watch } = renderWatch();

	act(() => watch('the-call', null));
	await settle(10_000);

	expect(leave).not.toHaveBeenCalled();
});

// The main app reloading or navigating away is not the call window closing — and the call window is meant to
// outlive both, so a leave must not be reported on the way out.
it('does not report leaving when the app itself goes away', async () => {
	const { watch, unmount } = renderWatch();
	const target = fakeWindow();

	act(() => watch('the-call', target));
	unmount();

	(target as { closed: boolean }).closed = true;
	await settle(10_000);

	expect(leave).not.toHaveBeenCalled();
});

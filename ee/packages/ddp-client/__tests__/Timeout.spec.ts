import { TimeoutControl } from '../src/TimeoutControl';

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

it('should call the heartbeat and timeout callbacks respecting the informed time', async function () {
	const heartbeatCallback = jest.fn();
	const timeoutCallback = jest.fn();

	const timeout = new TimeoutControl(100);
	timeout.reset();

	expect(setTimeout).toHaveBeenCalledTimes(2);

	timeout.on('heartbeat', heartbeatCallback);
	timeout.on('timeout', timeoutCallback);

	// At this point in time, the callback should not have been called yet
	expect(heartbeatCallback).not.toBeCalled();
	expect(timeoutCallback).not.toBeCalled();

	jest.advanceTimersByTime(60);

	expect(heartbeatCallback).toHaveBeenCalledTimes(1);
	expect(timeoutCallback).not.toBeCalled();

	jest.advanceTimersByTime(60);

	expect(heartbeatCallback).toHaveBeenCalledTimes(1);
	expect(timeoutCallback).toHaveBeenCalledTimes(1);
});

it('should never call the timeout callback if the reset method is called', async function () {
	const heartbeatCallback = jest.fn();
	const timeoutCallback = jest.fn();

	const timeout = new TimeoutControl(100);
	timeout.reset();

	expect(setTimeout).toHaveBeenCalledTimes(2);

	timeout.on('heartbeat', heartbeatCallback);
	timeout.on('timeout', timeoutCallback);

	// At this point in time, the callback should not have been called yet
	expect(heartbeatCallback).not.toBeCalled();
	expect(timeoutCallback).not.toBeCalled();

	jest.advanceTimersByTime(60);

	expect(heartbeatCallback).toHaveBeenCalledTimes(1);
	expect(timeoutCallback).not.toBeCalled();

	timeout.reset();

	jest.advanceTimersByTime(60);

	expect(heartbeatCallback).toHaveBeenCalledTimes(2);
	expect(timeoutCallback).not.toBeCalled();
});

afterEach(() => {
	jest.clearAllMocks();
});

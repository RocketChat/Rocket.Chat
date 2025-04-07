import { render } from '@testing-library/react';

import { useSafeRefCallback } from './useSafeRefCallback';

// const TestComponent = (callback: () => () => void) => {
// 	const cbRef = useSafeRefCallback(callback);

// 	return <div ref={cbRef}></div>;
// };

const TestComponent = ({ callback, renderSpan }: { callback: any; renderSpan?: boolean }) => {
	const cbRef = useSafeRefCallback(callback);

	if (renderSpan) {
		return <span ref={cbRef}></span>;
	}
	return <div ref={cbRef}></div>;
};

describe('useSafeRefCallback', () => {
	it('should work as a regular callbackRef if cleanup is not provided', () => {
		const callback = jest.fn();

		const { rerender, unmount } = render(<TestComponent callback={callback} />);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback.mock.lastCall[0]).toBeInstanceOf(HTMLDivElement);

		rerender(<TestComponent callback={callback} renderSpan />);

		expect(callback).toHaveBeenCalledTimes(3);
		expect(callback.mock.calls[1][0]).toBe(null);
		expect(callback.mock.calls[2][0]).toBeInstanceOf(HTMLSpanElement);

		unmount();

		expect(callback).toHaveBeenCalledTimes(4);
		expect(callback.mock.calls[3][0]).toBe(null);
	});

	it('should run again when callback reference changes', () => {
		const callback = jest.fn();

		const { rerender, unmount } = render(<TestComponent callback={callback} />);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback.mock.lastCall[0]).toBeInstanceOf(HTMLDivElement);

		const callback2 = jest.fn();

		rerender(<TestComponent callback={callback2} />);

		// Ensure first callback has been properly unmounted
		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback.mock.calls[1][0]).toBe(null);

		expect(callback2).toHaveBeenCalledTimes(1);
		expect(callback2.mock.lastCall[0]).toBeInstanceOf(HTMLDivElement);

		rerender(<TestComponent callback={callback2} renderSpan />);

		expect(callback2).toHaveBeenCalledTimes(3);
		expect(callback2.mock.calls[1][0]).toBe(null);
		expect(callback2.mock.calls[2][0]).toBeInstanceOf(HTMLSpanElement);

		unmount();

		expect(callback2).toHaveBeenCalledTimes(4);
		expect(callback2.mock.calls[3][0]).toBe(null);
	});

	it('should call cleanup with previous value on rerender', () => {
		const cleanup = jest.fn();
		const callback = jest.fn<() => void, any>(() => cleanup);

		const { rerender, unmount } = render(<TestComponent callback={callback} />);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback.mock.lastCall[0]).toBeInstanceOf(HTMLDivElement);

		expect(cleanup).not.toHaveBeenCalled();

		rerender(<TestComponent callback={callback} renderSpan />);

		expect(callback).toHaveBeenCalledTimes(3);
		expect(callback.mock.calls[1][0]).toBe(null);
		expect(callback.mock.calls[2][0]).toBeInstanceOf(HTMLSpanElement);

		expect(cleanup).toHaveBeenCalledTimes(2);

		const cleanup2 = jest.fn();
		const callback2 = jest.fn<() => void, any>(() => cleanup2);

		rerender(<TestComponent callback={callback2} renderSpan />);

		// Ensure first callback has been properly unmounted
		expect(callback).toHaveBeenCalledTimes(4);
		expect(callback.mock.calls[3][0]).toBe(null);

		console.log(cleanup.mock.calls);
		expect(cleanup).toHaveBeenCalledTimes(3);

		expect(callback2).toHaveBeenCalledTimes(1);
		expect(callback2.mock.lastCall[0]).toBeInstanceOf(HTMLSpanElement);

		expect(cleanup2).not.toHaveBeenCalled();

		rerender(<TestComponent callback={callback2} />);

		expect(callback2).toHaveBeenCalledTimes(3);
		expect(callback2.mock.calls[1][0]).toBe(null);
		expect(callback2.mock.calls[2][0]).toBeInstanceOf(HTMLDivElement);

		expect(cleanup2).toHaveBeenCalledTimes(2);

		unmount();

		expect(callback2).toHaveBeenCalledTimes(4);
		expect(callback2.mock.calls[3][0]).toBe(null);

		expect(cleanup2).toHaveBeenCalledTimes(3);
	});
});

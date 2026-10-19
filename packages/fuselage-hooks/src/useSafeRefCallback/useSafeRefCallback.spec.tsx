import { render } from '@testing-library/react';

import type { SafeCallbackRef } from './useSafeRefCallback';
import { useSafeRefCallback } from './useSafeRefCallback';

type TestComponentProps = {
	callback: SafeCallbackRef<HTMLElement>;
};

const DivTestComponent = ({ callback }: TestComponentProps) => {
	const cbRef = useSafeRefCallback(callback);

	return <div ref={cbRef} />;
};

const SpanTestComponent = ({ callback }: TestComponentProps) => {
	const cbRef = useSafeRefCallback(callback);

	return <span ref={cbRef} />;
};

describe('useSafeRefCallback', () => {
	it('should work as a regular callbackRef if cleanup is not provided', () => {
		const callback = jest.fn((_: unknown) => undefined);

		const { rerender, unmount } = render(<DivTestComponent callback={callback} />);

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback.mock.lastCall?.[0]).toBeInstanceOf(HTMLDivElement);

		rerender(<SpanTestComponent callback={callback} />);

		expect(callback).toHaveBeenCalledTimes(4);
		expect(callback.mock.lastCall?.[0]).toBeInstanceOf(HTMLSpanElement);

		unmount();

		expect(callback).toHaveBeenCalledTimes(4);
	});

	it('should run again when callback reference changes', () => {
		const callback1 = jest.fn((_: unknown) => undefined);
		const callback2 = jest.fn((_: unknown) => undefined);

		const { rerender, unmount } = render(<DivTestComponent callback={callback1} />);

		expect(callback1).toHaveBeenCalledTimes(2);
		expect(callback1.mock.lastCall?.[0]).toBeInstanceOf(HTMLDivElement);

		rerender(<DivTestComponent callback={callback2} />);

		expect(callback1).toHaveBeenCalledTimes(2);

		expect(callback2).toHaveBeenCalledTimes(1);
		expect(callback2.mock.lastCall?.[0]).toBeInstanceOf(HTMLDivElement);

		rerender(<SpanTestComponent callback={callback2} />);

		expect(callback2).toHaveBeenCalledTimes(3);
		expect(callback2.mock.lastCall?.[0]).toBeInstanceOf(HTMLSpanElement);

		unmount();

		expect(callback2).toHaveBeenCalledTimes(3);
	});

	it('should call cleanup if callback changes', () => {
		const cleanup1 = jest.fn();
		const callback1 = jest.fn((_: unknown) => cleanup1);
		const cleanup2 = jest.fn();
		const callback2 = jest.fn((_: unknown) => cleanup2);

		const { rerender, unmount } = render(<DivTestComponent callback={callback1} />);

		expect(callback1).toHaveBeenCalledTimes(2);
		expect(callback1.mock.lastCall?.[0]).toBeInstanceOf(HTMLDivElement);
		expect(cleanup1).toHaveBeenCalledTimes(1);

		rerender(<DivTestComponent callback={callback2} />);

		// Ensure first callback has been properly unmounted
		expect(callback1).toHaveBeenCalledTimes(2);
		expect(callback1.mock.lastCall?.[0]).toBeInstanceOf(HTMLDivElement);

		expect(cleanup1).toHaveBeenCalledTimes(2);

		expect(callback2).toHaveBeenCalledTimes(1);
		expect(callback2.mock.lastCall?.[0]).toBeInstanceOf(HTMLDivElement);
		expect(cleanup2).not.toHaveBeenCalled();

		rerender(<SpanTestComponent callback={callback2} />);

		expect(callback2).toHaveBeenCalledTimes(3);
		expect(callback2.mock.lastCall?.[0]).toBeInstanceOf(HTMLSpanElement);

		expect(cleanup2).toHaveBeenCalledTimes(2);

		unmount();

		expect(callback2).toHaveBeenCalledTimes(3);

		expect(cleanup2).toHaveBeenCalledTimes(3);
	});

	it('should call cleanup with previous value on rerender', () => {
		const cleanup1 = jest.fn();
		const callback1 = jest.fn((_: unknown) => cleanup1);
		const cleanup2 = jest.fn();
		const callback2 = jest.fn((_: unknown) => cleanup2);

		const { rerender, unmount } = render(<DivTestComponent callback={callback1} />);

		expect(callback1).toHaveBeenCalledTimes(2);
		expect(callback1.mock.lastCall?.[0]).toBeInstanceOf(HTMLDivElement);

		expect(cleanup1).toHaveBeenCalledTimes(1);

		rerender(<SpanTestComponent callback={callback1} />);

		expect(callback1).toHaveBeenCalledTimes(4);
		expect(callback1.mock.lastCall?.[0]).toBeInstanceOf(HTMLSpanElement);

		expect(cleanup1).toHaveBeenCalledTimes(3);

		rerender(<SpanTestComponent callback={callback2} />);

		expect(callback1).toHaveBeenCalledTimes(4);
		expect(cleanup1).toHaveBeenCalledTimes(4);

		expect(callback2).toHaveBeenCalledTimes(1);
		expect(callback2.mock.lastCall?.[0]).toBeInstanceOf(HTMLSpanElement);

		expect(cleanup2).not.toHaveBeenCalled();

		rerender(<DivTestComponent callback={callback2} />);

		expect(callback2).toHaveBeenCalledTimes(3);
		expect(callback2.mock.lastCall?.[0]).toBeInstanceOf(HTMLDivElement);

		expect(cleanup2).toHaveBeenCalledTimes(2);

		unmount();

		expect(callback2).toHaveBeenCalledTimes(3);
		expect(cleanup2).toHaveBeenCalledTimes(3);
	});
});

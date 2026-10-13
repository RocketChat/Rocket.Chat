import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useMediaCallTakeOverAction } from './useMediaCallTakeOverAction';
import MockedInstanceProvider from '../providers/MockedInstanceProvider';

const createInstance = (canTakeOverCall: boolean) => ({
	canTakeOverCall: jest.fn(() => canTakeOverCall),
	takeOverCall: jest.fn(),
	getState: () => null,
	on: () => () => undefined,
});

const createWrapper = (instance: unknown) => {
	const wrapper = ({ children }: { children?: ReactNode }) => (
		<MockedInstanceProvider instance={instance as any}>{children}</MockedInstanceProvider>
	);
	return wrapper;
};

describe('useMediaCallTakeOverAction', () => {
	it('returns nothing without a call instance', () => {
		const { result } = renderHook(() => useMediaCallTakeOverAction(), { wrapper: createWrapper(undefined) });

		expect(result.current).toBeUndefined();
	});

	it('returns nothing when there is no call to take over', () => {
		const instance = createInstance(false);
		const { result } = renderHook(() => useMediaCallTakeOverAction(), { wrapper: createWrapper(instance) });

		expect(result.current).toBeUndefined();
	});

	it('takes the call over when the action runs', () => {
		const instance = createInstance(true);
		const { result } = renderHook(() => useMediaCallTakeOverAction(), { wrapper: createWrapper(instance) });

		expect(result.current).toEqual(expect.objectContaining({ title: 'Continue_call_here', icon: 'phone-in' }));

		act(() => result.current?.action());

		expect(instance.takeOverCall).toHaveBeenCalledTimes(1);
	});

	it('does not throw when the session refuses the take over', () => {
		const instance = createInstance(true);
		instance.takeOverCall.mockImplementation(() => {
			throw new Error('No call to take over.');
		});
		const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const { result } = renderHook(() => useMediaCallTakeOverAction(), { wrapper: createWrapper(instance) });

		expect(() => act(() => result.current?.action())).not.toThrow();

		consoleError.mockRestore();
	});
});

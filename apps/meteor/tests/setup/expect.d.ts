import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import type { expect } from 'expect';
import type { FunctionLike, UnknownFunction } from 'jest-mock';

declare module 'expect' {
	interface Matchers<R extends void | Promise<void>> extends TestingLibraryMatchers<ReturnType<typeof expect.stringContaining>, R> {
		toHaveNoViolations(): R;
		// @types/jest accepted any arguments here; jest-mock types them from the mocked function
		toHaveBeenCalledWith(...expected: unknown[]): R;
		toHaveBeenLastCalledWith(...expected: unknown[]): R;
		toHaveBeenNthCalledWith(nth: number, ...expected: unknown[]): R;
	}
}

declare module 'jest-mock' {
	// @types/jest checked an implementation against the mocked function's parameters and return type only
	interface MockInstance<T extends FunctionLike = UnknownFunction> {
		mockImplementation(fn: (...args: any[]) => any): this;
		mockImplementationOnce(fn: (...args: any[]) => any): this;
	}
}

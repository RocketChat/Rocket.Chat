import { memoize, clear } from './memoize';

it('should memoize a function that takes no parameter', () => {
	const fn = jest.fn(() => 'foo');
	const memoized = jest.fn(memoize(fn));

	memoized(undefined);
	memoized(undefined);

	expect(memoized).toHaveBeenCalledTimes(2);
	expect(fn).toHaveBeenCalledTimes(1);

	expect(fn).toHaveReturnedWith('foo');
	expect(memoized).toHaveReturnedWith('foo');
});

it('should memoize a function that takes one parameter', () => {
	const fn = jest.fn((i: number) => i + 1);
	const memoized = jest.fn(memoize(fn));

	memoized(5);
	memoized(5);
	memoized(2);

	expect(memoized).toHaveBeenCalledTimes(3);
	expect(fn).toHaveBeenCalledTimes(2);

	expect(fn).toHaveNthReturnedWith(1, 6);
	expect(fn).toHaveNthReturnedWith(2, 3);

	expect(memoized).toHaveNthReturnedWith(1, 6);
	expect(memoized).toHaveNthReturnedWith(2, 6);
	expect(memoized).toHaveNthReturnedWith(3, 3);
});

describe('clear', () => {
	it('should discard cached values of a memoized function', () => {
		const fn = jest.fn(() => 'foo');
		const memoized = memoize(fn);
		const spiedMemoized = jest.fn(memoized);

		spiedMemoized(undefined);
		spiedMemoized(undefined);
		clear(memoized);
		spiedMemoized(undefined);

		expect(spiedMemoized).toHaveBeenCalledTimes(3);
		expect(fn).toHaveBeenCalledTimes(2);

		expect(fn).toHaveReturnedWith('foo');
		expect(spiedMemoized).toHaveReturnedWith('foo');
	});

	it('should do nothing when a non-memoized function is passed', () => {
		const fn = jest.fn(() => 'foo');

		expect(() => clear(fn)).not.toThrow();
	});
});

describe('timeout', () => {
	it('should memoize a function that takes one parameter and clear after x ms', () => {
		jest.useFakeTimers();

		const fn = jest.fn((i: number) => i + 1);
		const memoized = jest.fn(memoize(fn, { maxAge: 3000 }));

		memoized(5);
		jest.advanceTimersByTime(2000);
		memoized(5);
		jest.advanceTimersByTime(2000);
		memoized(5);
		jest.advanceTimersByTime(3000);
		memoized(5);

		expect(fn).toHaveBeenCalledTimes(2);

		expect(memoized).toHaveNthReturnedWith(1, 6);
		expect(memoized).toHaveNthReturnedWith(2, 6);
		expect(memoized).toHaveNthReturnedWith(3, 6);
		expect(memoized).toHaveNthReturnedWith(4, 6);
	});

	it('should memoize a function caching for two parameters and clearing both after x ms each one', () => {
		jest.useFakeTimers();

		const fn = jest.fn((i: number) => i + 1);
		const memoized = jest.fn(memoize(fn, { maxAge: 3000 }));

		memoized(5);
		jest.advanceTimersByTime(2000);
		memoized(6);
		jest.advanceTimersByTime(2000);

		memoized(6);
		memoized(5);

		expect(fn).toHaveBeenCalledTimes(3);

		expect(memoized).toHaveNthReturnedWith(1, 6);
		expect(memoized).toHaveNthReturnedWith(2, 7);
		expect(memoized).toHaveNthReturnedWith(3, 7);
		expect(memoized).toHaveNthReturnedWith(4, 6);
	});
});

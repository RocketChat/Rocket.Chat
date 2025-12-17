import { it, expect } from '@jest/globals';

import { CallbackPriority, Callbacks } from './Callbacks';

it("if the callback doesn't return any value should return the original", async () => {
	const test = Callbacks.create<(data: boolean) => boolean>('test');

	test.add(() => undefined, CallbackPriority.LOW, '1');

	const result = await test.run(true);

	expect(result).toBe(true);
});

it('should return the value returned by the callback', async () => {
	const test = Callbacks.create<(data: boolean) => boolean>('test');

	test.add(() => false, CallbackPriority.LOW, '1');

	const result = await test.run(true);

	expect(result).toBe(false);
});

it('should accumulate the values returned by the callbacks', async () => {
	const test = Callbacks.create<(data: number) => number>('test');

	test.add((old) => old * 5);

	test.add((old) => old * 2);

	expect(await test.run(3)).toBe(30);

	expect(await test.run(2)).toBe(20);
});

import { it, expect } from '@jest/globals';

import { clientCallbacks } from './clientCallbacks';

it("if the callback doesn't return any value should return the original", async () => {
	clientCallbacks.add('test', () => undefined, clientCallbacks.priority.LOW, '1');

	const result = await clientCallbacks.run('test', true);

	expect(result).toBe(true);

	clientCallbacks.remove('test', '1');
});

it('should return the value returned by the callback', async () => {
	clientCallbacks.add('test', () => false, clientCallbacks.priority.LOW, '1');

	const result = await clientCallbacks.run('test', true);

	expect(result).toBe(false);

	clientCallbacks.remove('test', '1');
});

it('should accumulate the values returned by the callbacks', async () => {
	clientCallbacks.add('test', (old: number) => old * 5);

	clientCallbacks.add('test', (old: number) => old * 2);

	expect(await clientCallbacks.run('test', 3)).toBe(30);

	expect(await clientCallbacks.run('test', 2)).toBe(20);
});

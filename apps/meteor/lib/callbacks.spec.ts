import { expect } from 'chai';
import { describe, it } from 'mocha';

import { callbacks } from './callbacks';
import { Callbacks } from './callbacks/callbacksBase';

describe('callbacks legacy', () => {
	it("if the callback doesn't return any value should return the original", async () => {
		callbacks.add('test', () => undefined, callbacks.priority.LOW, '1');

		const result = await callbacks.run('test', true);

		expect(result).to.be.true;

		callbacks.remove('test', '1');
	});

	it('should return the value returned by the callback', async () => {
		callbacks.add('test', () => false, callbacks.priority.LOW, '1');

		const result = await callbacks.run('test', true);

		expect(result).to.be.false;

		callbacks.remove('test', '1');
	});

	it('should accumulate the values returned by the callbacks', async () => {
		callbacks.add('test', (old: number) => old * 5);

		callbacks.add('test', (old: number) => old * 2);

		expect(await callbacks.run('test', 3)).to.be.equal(30);

		expect(await callbacks.run('test', 2)).to.be.equal(20);
	});
});

describe('callbacks', () => {
	it("if the callback doesn't return any value should return the original", async () => {
		const test = Callbacks.create<(data: boolean) => boolean>('test');

		test.add(() => undefined, callbacks.priority.LOW, '1');

		const result = await test.run(true);

		expect(result).to.be.true;
	});

	it('should return the value returned by the callback', async () => {
		const test = Callbacks.create<(data: boolean) => boolean>('test');

		test.add(() => false, callbacks.priority.LOW, '1');

		const result = await test.run(true);

		expect(result).to.be.false;
	});

	it('should accumulate the values returned by the callbacks', async () => {
		const test = Callbacks.create<(data: number) => number>('test');

		test.add((old) => old * 5);

		test.add((old) => old * 2);

		expect(await test.run(3)).to.be.equal(30);

		expect(await test.run(2)).to.be.equal(20);
	});
});

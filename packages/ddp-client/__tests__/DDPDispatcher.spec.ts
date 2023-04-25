import { DDPDispatcher } from '../src/DDPDispatcher';
import { MinimalDDPClient } from '../src/MinimalDDPClient';

it('should create a block properly', () => {
	const ddp = new MinimalDDPClient(() => undefined);

	const ddpDispatcher = new DDPDispatcher(ddp);

	ddpDispatcher.addBlock({ msg: 'test' });
	expect(ddpDispatcher.queue).toEqual([
		{
			wait: true,
			items: [{ msg: 'test' }],
		},
	]);
});

it('should push an item to the block properly', () => {
	const ddp = new MinimalDDPClient(() => undefined);

	const ddpDispatcher = new DDPDispatcher(ddp);

	ddpDispatcher.addBlock({ msg: 'test1' });
	ddpDispatcher.pushItem({ msg: 'test2' });
	expect(ddpDispatcher.queue).toEqual([
		{
			wait: true,
			items: [{ msg: 'test1' }],
		},
		{
			wait: false,
			items: [{ msg: 'test2' }],
		},
	]);
});

it('should remove an item from the block properly', () => {
	const ddp = new MinimalDDPClient(() => undefined);

	const ddpDispatcher = new DDPDispatcher(ddp);

	const blockToRemove = { msg: 'test1' };

	ddpDispatcher.addBlock(blockToRemove);

	ddpDispatcher.pushItem({ msg: 'test2' });

	ddpDispatcher.removeItem(blockToRemove);

	expect(ddpDispatcher.queue).toEqual([
		{
			wait: false,
			items: [
				{
					msg: 'test2',
				},
			],
		},
	]);
});

it('should send outstanding blocks if there is no block waiting and item is added', () => {
	const fn = jest.fn();
	const ddp = new MinimalDDPClient(() => undefined);

	const ddpDispatcher = new DDPDispatcher(ddp);
	ddpDispatcher.on('dispatch', fn);

	ddpDispatcher.pushItem({ msg: 'test' });

	expect(fn).toBeCalledTimes(1);
});

it('should send the next blocks if the outstanding block was completed', () => {
	const fn = jest.fn();
	const ddp = new MinimalDDPClient(() => undefined);

	const ddpDispatcher = new DDPDispatcher(ddp);
	ddpDispatcher.on('dispatch', fn);

	const block1 = { msg: 'block1' };

	const block2 = { msg: 'block2' };

	ddpDispatcher.addBlock(block1);
	ddpDispatcher.addBlock(block2);

	ddpDispatcher.pushItem({ msg: 'test2' });

	expect(fn).toBeCalledTimes(1);

	ddpDispatcher.removeItem(block1);

	expect(fn).toBeCalledTimes(2);

	expect(ddpDispatcher.queue.length).toBe(2);

	expect(ddpDispatcher.queue).toEqual([
		{
			wait: true,
			items: [
				{
					msg: 'block2',
				},
			],
		},
		{
			wait: false,
			items: [
				{
					msg: 'test2',
				},
			],
		},
	]);

	ddpDispatcher.removeItem(block2);

	expect(ddpDispatcher.queue.length).toBe(1);

	expect(ddpDispatcher.queue).toEqual([
		{
			wait: false,
			items: [
				{
					msg: 'test2',
				},
			],
		},
	]);

	expect(fn).toBeCalledTimes(3);
	expect(fn).toHaveBeenNthCalledWith(1, { msg: 'block1' });
	expect(fn).toHaveBeenNthCalledWith(2, { msg: 'block2' });
	expect(fn).toHaveBeenNthCalledWith(3, { msg: 'test2' });
});

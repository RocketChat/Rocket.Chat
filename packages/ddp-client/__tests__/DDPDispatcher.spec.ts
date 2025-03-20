import { DDPDispatcher } from '../src/DDPDispatcher';
import { MinimalDDPClient } from '../src/MinimalDDPClient';

const ddp = new MinimalDDPClient();

it('should create a block properly', () => {
	const ddpDispatcher = new DDPDispatcher();

	const test = ddp.call('test');

	ddpDispatcher.wait(test);
	expect(ddpDispatcher.queue).toEqual([
		{
			wait: true,
			items: [test],
		},
	]);
});

it('should push an item to the block properly', () => {
	const ddpDispatcher = new DDPDispatcher();

	const test1 = ddp.call('test1');
	const test2 = ddp.call('test2');
	ddpDispatcher.wait(test1);
	ddpDispatcher.dispatch(test2);
	expect(ddpDispatcher.queue).toEqual([
		{
			wait: true,
			items: [test1],
		},
		{
			wait: false,
			items: [test2],
		},
	]);
});

it('should not keep in the queue if the method doesnt wait', () => {
	const ddpDispatcher = new DDPDispatcher();

	const blockToRemove = ddp.call('test1');
	const test2 = ddp.call('test2');

	ddpDispatcher.dispatch(blockToRemove, { wait: true });
	ddpDispatcher.dispatch(test2, { wait: false });

	expect(ddpDispatcher.queue).toEqual([
		{
			wait: true,
			items: [blockToRemove],
		},
		{
			wait: false,
			items: [test2],
		},
	]);

	ddpDispatcher.removeItem(blockToRemove);

	expect(ddpDispatcher.queue).toEqual([]);
});

it('should send outstanding blocks if there is no block waiting and item is added', () => {
	const fn = jest.fn();

	const ddpDispatcher = new DDPDispatcher();
	ddpDispatcher.on('send', fn);

	ddpDispatcher.dispatch(ddp.call('test1'));

	expect(fn).toBeCalledTimes(1);
});

it('should send the next blocks if the outstanding block was completed', () => {
	const fn = jest.fn();

	const ddpDispatcher = new DDPDispatcher();
	ddpDispatcher.on('send', fn);

	const block1 = ddp.call('block1');

	const block2 = ddp.call('block2');

	const block3 = ddp.call('test2');

	ddpDispatcher.dispatch(block1, { wait: true });
	ddpDispatcher.dispatch(block2, { wait: true });

	ddpDispatcher.dispatch(block3);

	expect(fn).toBeCalledTimes(1);

	ddpDispatcher.removeItem(block1);

	expect(fn).toBeCalledTimes(2);

	expect(ddpDispatcher.queue.length).toBe(2);

	expect(ddpDispatcher.queue).toEqual([
		{
			wait: true,
			items: [block2],
		},
		{
			wait: false,
			items: [block3],
		},
	]);

	ddpDispatcher.removeItem(block2);

	expect(ddpDispatcher.queue.length).toBe(0);

	expect(ddpDispatcher.queue).toEqual([]);

	expect(fn).toBeCalledTimes(3);
	expect(fn).toHaveBeenNthCalledWith(1, block1);
	expect(fn).toHaveBeenNthCalledWith(2, block2);
	expect(fn).toHaveBeenNthCalledWith(3, block3);
});

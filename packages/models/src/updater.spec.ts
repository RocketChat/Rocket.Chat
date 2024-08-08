import type { IOmnichannelRoom } from '@rocket.chat/core-typings';

import { UpdaterImpl } from './updater';

test('updater typings', () => {
	const updater = new UpdaterImpl<{
		_id: string;
		t: 'l';
		a: {
			b: string;
		};
		c?: number;

		d?: {
			e: string;
		};
		e: string[];
	}>({} as any);

	const omnichannel = new UpdaterImpl<IOmnichannelRoom>({} as any);
	omnichannel.addToSet('v.activity', 'asd');
	// @ts-expect-error
	omnichannel.addToSet('v.activity', 1);
	// @ts-expect-error
	omnichannel.addToSet('v.activity', {
		asdas: 1,
	});

	// @ts-expect-error
	omnichannel.addToSet('v.activity.asd', {
		asdas: 1,
	});

	updater.addToSet('e', 'a');

	// @ts-expect-error
	updater.addToSet('e', 1);
	// @ts-expect-error
	updater.addToSet('a', 'b');

	// @ts-expect-error
	updater.set('njame', 1);
	// @ts-expect-error
	updater.set('ttes', 1);
	// @ts-expect-error
	updater.set('t', 'a');
	updater.set('t', 'l');
	// @ts-expect-error
	updater.set('a', 'b');
	// @ts-expect-error
	updater.set('c', 'b');
	updater.set('c', 1);

	updater.set('a', {
		b: 'set',
	});
	updater.set('a.b', 'test');

	// @ts-expect-error
	updater.unset('a');

	updater.unset('c');

	updater.unset('d');

	updater.unset('d.e');
	// @ts-expect-error
	updater.inc('d', 1);
	updater.inc('c', 1);
});

test('updater $set operations', async () => {
	const updateOne = jest.fn();

	const updater = new UpdaterImpl<{
		_id: string;
		t: 'l';
		a: {
			b: string;
		};
		c?: number;
	}>({
		updateOne,
	} as any);

	updater.set('a', {
		b: 'set',
	});

	await updater.persist({
		_id: 'test',
	});

	expect(updateOne).toBeCalledWith(
		{
			_id: 'test',
		},
		{ $set: { a: { b: 'set' } } },
	);
});

test('updater $unset operations', async () => {
	const updateOne = jest.fn();

	const updater = new UpdaterImpl<{
		_id: string;
		t: 'l';
		a: {
			b: string;
		};
		c?: number;
	}>({
		updateOne,
	} as any);

	updater.unset('c');

	await updater.persist({
		_id: 'test',
	});

	expect(updateOne).toBeCalledWith(
		{
			_id: 'test',
		},
		{ $unset: { c: 1 } },
	);
});

test('updater inc multiple operations', async () => {
	const updateOne = jest.fn();

	const updater = new UpdaterImpl<{
		_id: string;
		t: 'l';
		a: {
			b: string;
		};
		c?: number;
	}>({
		updateOne,
	} as any);

	updater.inc('c', 1);
	updater.inc('c', 1);

	await updater.persist({
		_id: 'test',
	});

	expect(updateOne).toBeCalledWith(
		{
			_id: 'test',
		},
		{ $inc: { c: 2 } },
	);
});

test('it should add items to array', async () => {
	const updateOne = jest.fn();
	const updater = new UpdaterImpl<{
		_id: string;
		a: string[];
	}>({
		updateOne,
	} as any);

	updater.addToSet('a', 'b');
	updater.addToSet('a', 'c');

	await updater.persist({
		_id: 'test',
	});

	expect(updateOne).toBeCalledWith(
		{
			_id: 'test',
		},
		{ $addToSet: { a: { $each: ['b', 'c'] } } },
	);
});

test('it should persist only once', async () => {
	const updateOne = jest.fn();

	const updater = new UpdaterImpl<{
		_id: string;
		t: 'l';
		a: {
			b: string;
		};
		c?: number;
	}>({
		updateOne,
	} as any);

	updater.set('a', {
		b: 'set',
	});

	await updater.persist({
		_id: 'test',
	});

	expect(updateOne).toBeCalledTimes(1);

	expect(() => updater.persist({ _id: 'test' })).rejects.toThrow();
});

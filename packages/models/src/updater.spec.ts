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
	}>();

	const omnichannel = new UpdaterImpl<IOmnichannelRoom>();
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
	const updater = new UpdaterImpl<{
		_id: string;
		t: 'l';
		a: {
			b: string;
		};
		c?: number;
	}>();

	updater.set('a', {
		b: 'set',
	});

	expect(updater.getUpdateFilter()).toEqual({ $set: { a: { b: 'set' } } });
});

test('updater $unset operations', async () => {
	const updater = new UpdaterImpl<{
		_id: string;
		t: 'l';
		a: {
			b: string;
		};
		c?: number;
	}>();
	updater.unset('c');
	expect(updater.getUpdateFilter()).toEqual({ $unset: { c: 1 } });
});

test('updater inc multiple operations', async () => {
	const updater = new UpdaterImpl<{
		_id: string;
		t: 'l';
		a: {
			b: string;
		};
		c?: number;
	}>();

	updater.inc('c', 1);
	updater.inc('c', 1);

	expect(updater.getUpdateFilter()).toEqual({ $inc: { c: 2 } });
});

test('it should add items to array', async () => {
	const updater = new UpdaterImpl<{
		_id: string;
		a: string[];
	}>();

	updater.addToSet('a', 'b');
	updater.addToSet('a', 'c');

	expect(updater.getUpdateFilter()).toEqual({ $addToSet: { a: { $each: ['b', 'c'] } } });
});

test('it should getUpdateFilter only once', async () => {
	const updater = new UpdaterImpl<{
		_id: string;
		t: 'l';
		a: {
			b: string;
		};
		c?: number;
	}>();

	updater.set('a', {
		b: 'set',
	});

	expect(updater.getUpdateFilter()).toEqual({ $set: { a: { b: 'set' } } });
	expect(() => updater.getUpdateFilter()).toThrow();
});

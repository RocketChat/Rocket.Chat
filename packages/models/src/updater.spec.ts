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

	// @ts-expect-error: it should not allow any string to `t` only `l` is allowed
	updater.set('t', 'a');
	// `l` is allowed
	updater.set('t', 'l');

	// `a` is { b: string }
	updater.set('a', { b: 'test' });
	updater.set('a.b', 'test');
	// @ts-expect-error: it should not allow strings to `a`, a is an object containing `b: string`
	updater.set('a', 'b');
	// @ts-expect-error: `a` is not optional so unset is not allowed
	updater.unset('a');
	// @ts-expect-error: strings cannot be incremented
	updater.inc('a', 1);

	// `c` is number but it should be optional, so unset is allowed
	updater.unset('c');
	updater.set('c', 1);
	// @ts-expect-error: `c` is a number
	updater.set('c', 'b');
	// inc is allowed for numbers
	updater.inc('c', 1);

	// `d` is { e: string } but it should be optional, so unset is allowed
	updater.unset('d');
	updater.set('d', { e: 'a' });
	// @ts-expect-error: `d` is an object
	updater.set('d', 'a');

	// @ts-expect-error: it should not allow numbers, since e is a string
	updater.addToSet('e', 1);
	// @ts-expect-error: it should not allow strings, since a is an object
	updater.addToSet('a', 'b');

	updater.addToSet('e', 'a');
	// @ts-expect-error: it should not allow `njame` its not specified in the model
	updater.set('njame', 1);

	// `d` is { e: string } and also it should be optional, so unset is allowed
	updater.unset('d.e');
	// @ts-expect-error: `d` is an object cannot be incremented
	updater.inc('d', 1);

	// `activity` is a string
	const omnichannel = new UpdaterImpl<IOmnichannelRoom>();
	omnichannel.addToSet('v.activity', 'asd');
	// @ts-expect-error: it should not allow numbers, since activity is a string
	omnichannel.addToSet('v.activity', 1);
	// @ts-expect-error: it should not allow objects, since activity is a string
	omnichannel.addToSet('v.activity', {
		asdas: 1,
	});
	// @ts-expect-error: it should not allow sub properties, since activity is a string
	omnichannel.addToSet('v.activity.asd', {
		asdas: 1,
	});
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

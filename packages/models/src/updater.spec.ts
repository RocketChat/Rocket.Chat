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

test('it should do everything on the update filter', async () => {
	const updater = new UpdaterImpl<{
		_id: string;
		a: string[];
		b: string;
		c: number;
		d: number;
		e: string[];
		f: string;
		g: string;
		h: string[];
	}>();

	updater.addUpdateFilter({
		$addToSet: {
			a: 'a1',
			h: { $each: ['h1', 'h2'] },
		},
		$set: {
			b: 'b1',
			g: 'g1',
		},
		$unset: {
			d: 1,
		},
		$inc: {
			c: 1,
		},
	});

	updater.addUpdateFilter({
		$addToSet: {
			a: 'a2',
			e: 'e1',
		},
		$set: {
			b: 'b2',
			f: 'f2',
		},
		$unset: {
			d: 1,
		},
		$inc: {
			c: 2,
		},
	});

	expect(updater.getUpdateFilter()).toEqual({
		$addToSet: {
			a: { $each: ['a1', 'a2'] },
			e: { $each: ['e1'] },
			h: { $each: ['h1', 'h2'] },
		},
		$set: {
			b: 'b2',
			f: 'f2',
			g: 'g1',
		},
		$unset: {
			d: 1,
		},
		$inc: {
			c: 3,
		},
	});
});

test('it should combine $set and $addToSet operations to the same key', async () => {
	const updater = new UpdaterImpl<{
		_id: string;
		a: string[];
		b: string;
		c: string[];
	}>();

	updater.set('a', ['a1', 'a2']);
	updater.set('b', 'b1');
	updater.addToSet('a', 'a3');

	expect(updater.getUpdateFilter()).toEqual({
		$set: {
			a: ['a1', 'a2', 'a3'],
			b: 'b1',
		},
	});
});

test('it should discard any actions done on a key before a $set', async () => {
	const updater = new UpdaterImpl<{
		_id: string;
		a?: string;
		b: number;
		c: string[];
		d?: string;
	}>();

	updater.unset('a');
	updater.inc('b', 1);
	updater.addToSet('c', 'c1');
	updater.addToSet('c', 'c2');
	updater.unset('d');

	updater.set('a', 'a1');
	updater.set('b', 5);
	updater.set('c', ['c3']);

	expect(updater.getUpdateFilter()).toEqual({
		$set: {
			a: 'a1',
			b: 5,
			c: ['c3'],
		},
		$unset: {
			d: 1,
		},
	});
});

test('it should discard any actions done on a key before an $unset', async () => {
	const updater = new UpdaterImpl<{
		_id: string;
		a?: string;
		b?: number;
		c?: string[];
		d?: string;
	}>();

	updater.set('a', 'a1');
	updater.inc('b', 1);
	updater.addToSet('c', 'c1');
	updater.addToSet('c', 'c2');
	updater.set('d', 'd1');

	updater.unset('a');
	updater.unset('b');
	updater.unset('c');

	expect(updater.getUpdateFilter()).toEqual({
		$set: {
			d: 'd1',
		},
		$unset: {
			a: 1,
			b: 1,
			c: 1,
		},
	});
});

test('it should discard any $unset done on a key before another operation', async () => {
	const updater = new UpdaterImpl<{
		_id: string;
		a?: string;
		b?: number;
		c?: string[];
		d?: string;
	}>();

	updater.unset('a');
	updater.unset('b');
	updater.unset('c');
	updater.unset('d');

	updater.set('a', 'a1');
	updater.inc('b', 1);
	updater.addToSet('c', 'c1');
	updater.addToSet('c', 'c2');

	expect(updater.getUpdateFilter()).toEqual({
		$set: {
			a: 'a1',
		},
		$inc: {
			b: 1,
		},
		$addToSet: {
			c: { $each: ['c1', 'c2'] },
		},
		$unset: {
			d: 1,
		},
	});
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

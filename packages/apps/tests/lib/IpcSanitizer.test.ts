import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import * as v8 from 'node:v8';

import { App } from '@rocket.chat/apps-engine/definition/App';

import { sanitizeForIpc } from '../../src/lib/IpcSanitizer';

describe('sanitizeForIpc', () => {
	it('returns primitives unchanged', () => {
		assert.strictEqual(sanitizeForIpc('a string'), 'a string');
		assert.strictEqual(sanitizeForIpc(42), 42);
		assert.strictEqual(sanitizeForIpc(true), true);
		assert.strictEqual(sanitizeForIpc(null), null);
		assert.strictEqual(sanitizeForIpc(undefined), undefined);
		assert.strictEqual(sanitizeForIpc(10n), 10n);
	});

	it('replaces a function with undefined', () => {
		assert.strictEqual(
			sanitizeForIpc(() => 'nope'),
			undefined,
		);
	});

	it('replaces a symbol with undefined', () => {
		assert.strictEqual(sanitizeForIpc(Symbol('nope')), undefined);
	});

	it('strips function properties from objects while keeping the key', () => {
		const result = sanitizeForIpc({ keep: 'me', drop: () => 'me' });

		assert.deepStrictEqual(Object.keys(result), ['keep', 'drop']);
		assert.strictEqual(result.keep, 'me');
		assert.strictEqual(result.drop, undefined);
	});

	it('strips functions nested deep in objects and arrays', () => {
		const result = sanitizeForIpc({
			level1: {
				level2: [{ fn: () => 1, value: 1 }, () => 2, 'two'],
			},
		});

		assert.strictEqual(result.level1.level2[0].fn, undefined);
		assert.strictEqual(result.level1.level2[0].value, 1);
		assert.strictEqual(result.level1.level2[1], undefined);
		assert.strictEqual(result.level1.level2[2], 'two');
	});

	it('preserves array length when stripping function elements', () => {
		const result = sanitizeForIpc([1, () => 2, 3]);

		assert.strictEqual(result.length, 3);
		assert.deepStrictEqual(result, [1, undefined, 3]);
	});

	it('replaces App instances with undefined', () => {
		const app = Object.create(App.prototype) as App;

		assert.strictEqual(sanitizeForIpc(app), undefined);
		assert.strictEqual(sanitizeForIpc({ app }).app, undefined);
	});

	it('passes Buffers and typed arrays through untouched', () => {
		const buffer = Buffer.from('binary');
		const typedArray = new Uint16Array([1, 2, 3]);

		const result = sanitizeForIpc({ buffer, typedArray });

		assert.strictEqual(result.buffer, buffer);
		assert.strictEqual(result.typedArray, typedArray);
	});

	it('passes Dates, RegExps and Errors through untouched', () => {
		const date = new Date();
		const regexp = /pattern/g;
		const error = new Error('boom');

		const result = sanitizeForIpc({ date, regexp, error });

		assert.strictEqual(result.date, date);
		assert.strictEqual(result.regexp, regexp);
		assert.strictEqual(result.error, error);
	});

	it('sanitizes Map and Set contents', () => {
		const result = sanitizeForIpc({
			map: new Map<string, unknown>([
				['fn', () => 1],
				['value', 1],
			]),
			set: new Set<unknown>(['value']),
		});

		assert.strictEqual(result.map.get('fn'), undefined);
		assert.strictEqual(result.map.get('value'), 1);
		assert.ok(result.set.has('value'));
	});

	it('clones class instances into plain objects with own enumerable properties', () => {
		class Fixture {
			public value = 'kept';

			public method() {
				return 'dropped with the prototype';
			}
		}

		const result = sanitizeForIpc(new Fixture());

		assert.deepStrictEqual({ ...result }, { value: 'kept' });
		assert.strictEqual(Object.getPrototypeOf(result), Object.prototype);
	});

	it('preserves circular references without hanging', () => {
		const value: Record<string, unknown> = { name: 'cyclic' };
		value.self = value;

		const result = sanitizeForIpc(value);

		assert.strictEqual(result.self, result);
		assert.strictEqual(result.name, 'cyclic');
	});

	it('preserves shared references', () => {
		const shared = { id: 'shared' };

		const result = sanitizeForIpc({ first: shared, second: shared });

		assert.strictEqual(result.first, result.second);
	});

	it('produces output accepted by the V8 serializer', () => {
		const messy: Record<string, unknown> = {
			fn: () => 1,
			app: Object.create(App.prototype),
			buffer: Buffer.from('ok'),
			nested: { list: [() => 2, new Date()] },
		};
		messy.self = messy;

		assert.throws(() => v8.serialize(messy));
		assert.doesNotThrow(() => v8.serialize(sanitizeForIpc(messy)));
	});
});

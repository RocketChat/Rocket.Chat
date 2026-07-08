import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import { applySecureFields, applySecureFieldsDeep } from '../secureFields';

const SECURE_FIELDS_KEY = '@@SecureFields';

describe('applySecureFields', () => {
	beforeEach(() => {
		AppObjectRegistry.clear();
	});

	it('throws when app is unavailable', () => {
		assert.throws(() => applySecureFields({ foo: 'bar', [SECURE_FIELDS_KEY]: [] } as any), {
			message: "App unavailable, can't parse object with secure fields",
		});
	});

	it('applies only secure fields with matching permissions', () => {
		AppObjectRegistry.set('app', {
			getInfo: () => ({
				permissions: [{ name: 'abac.read' }],
			}),
		});

		const parsed = applySecureFields({
			foo: 'bar',
			[SECURE_FIELDS_KEY]: [
				{ permission: 'abac.read', name: 'abacAttributes', value: { department: 'support' } },
				{ permission: 'api.read', name: 'apiToken', value: 'secret' },
			],
		} as any);

		assert.deepStrictEqual(parsed, {
			foo: 'bar',
			abacAttributes: { department: 'support' },
		});
	});

	it('overwrites an existing field when permission is granted', () => {
		AppObjectRegistry.set('app', {
			getInfo: () => ({
				permissions: [{ name: 'abac.read' }],
			}),
		});

		const parsed = applySecureFields({
			abacAttributes: null,
			[SECURE_FIELDS_KEY]: [{ permission: 'abac.read', name: 'abacAttributes', value: { tenant: 'alpha' } }],
		} as any);

		assert.deepStrictEqual(parsed, {
			abacAttributes: { tenant: 'alpha' },
		});
	});
});

describe('applySecureFieldsDeep', () => {
	beforeEach(() => {
		AppObjectRegistry.clear();
		AppObjectRegistry.set('app', {
			getInfo: () => ({
				permissions: [{ name: 'abac.read' }],
			}),
		});
	});

	const markedRoom = () => ({
		id: 'general',
		[SECURE_FIELDS_KEY]: [{ permission: 'abac.read', name: 'abacAttributes', value: { department: 'support' } }],
	});

	it('applies secure fields on the root object', () => {
		assert.deepStrictEqual(applySecureFieldsDeep(markedRoom() as any), {
			id: 'general',
			abacAttributes: { department: 'support' },
		});
	});

	it('applies secure fields on nested objects', () => {
		const message = applySecureFieldsDeep({
			jsonrpc: '2.0',
			id: '1',
			method: 'app:event',
			params: [{ room: markedRoom(), sender: { username: 'rocket.cat' } }],
		} as any);

		assert.deepStrictEqual(message.params[0].room, {
			id: 'general',
			abacAttributes: { department: 'support' },
		});
		assert.deepStrictEqual(message.params[0].sender, { username: 'rocket.cat' });
	});

	it('withholds secure fields the app has no permission for', () => {
		const result = applySecureFieldsDeep({
			room: {
				id: 'general',
				[SECURE_FIELDS_KEY]: [{ permission: 'api.read', name: 'apiToken', value: 'secret' }],
			},
		} as any);

		assert.deepStrictEqual(result.room, { id: 'general' });
	});

	it('leaves values without the marker untouched', () => {
		const params = [{ room: { id: 'general' } }, 'literal', 42, null];

		const result = applySecureFieldsDeep(params);

		assert.strictEqual(result, params);
		assert.strictEqual(result[0], params[0]);
		assert.deepStrictEqual(result, [{ room: { id: 'general' } }, 'literal', 42, null]);
	});

	it('does not traverse binary or date values', () => {
		const buffer = Buffer.from('binary');
		const date = new Date();

		const result = applySecureFieldsDeep({ buffer, date } as any);

		assert.strictEqual(result.buffer, buffer);
		assert.strictEqual(result.date, date);
	});

	it('handles circular structures without hanging', () => {
		const value: Record<string, any> = { room: markedRoom() };
		value.self = value;

		const result = applySecureFieldsDeep(value);

		assert.strictEqual(result.self, result);
		assert.deepStrictEqual(result.room.abacAttributes, { department: 'support' });
	});

	it('throws when a marked object arrives while the app is unavailable', () => {
		AppObjectRegistry.clear();

		assert.throws(() => applySecureFieldsDeep({ room: markedRoom() } as any), {
			message: "App unavailable, can't parse object with secure fields",
		});
	});
});

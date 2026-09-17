import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import { applySecureFields } from '../secureFields';

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

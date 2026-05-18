import { assertEquals, assertThrows } from 'https://deno.land/std@0.203.0/assert/mod.ts';
import { beforeEach, describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';

import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { applySecureFields } from '../secureFields.ts';

const SECURE_FIELDS_KEY = '@@SecureFields';

describe('applySecureFields', () => {
	beforeEach(() => {
		AppObjectRegistry.clear();
	});

	it('throws when app is unavailable', () => {
		assertThrows(
			() => applySecureFields({ foo: 'bar', [SECURE_FIELDS_KEY]: [] } as any),
			Error,
			"App unavailable, can't parse object with secure fields",
		);
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

		assertEquals(parsed, {
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

		assertEquals(parsed, {
			abacAttributes: { tenant: 'alpha' },
		});
	});
});

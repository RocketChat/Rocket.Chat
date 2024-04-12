import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import type { PermissionsPayload } from '../../../../../../../app/api/server/api.helpers';
import { checkPermissions } from '../../../../../../../app/api/server/api.helpers';

describe('checkPermissions', () => {
	it('should return false when no options.permissionsRequired key is present', () => {
		const options = {};

		assert.strictEqual(checkPermissions(options), false);
	});

	it('should return false when options.permissionsRequired is of an invalid format', () => {
		const options = {
			permissionsRequired: 'invalid',
		};

		// @ts-expect-error - for testing purposes
		assert.strictEqual(checkPermissions(options), false);
	});

	it('should return true and modify options.permissionsRequired when permissionsRequired key is an array (of permissions)', () => {
		const options = {
			permissionsRequired: ['invalid', 'invalid2'],
		};

		assert.strictEqual(checkPermissions(options), true);
		assert.strictEqual(typeof options.permissionsRequired, 'object');
		assert.strictEqual(options.permissionsRequired.hasOwnProperty('*'), true);
		// @ts-expect-error -for test purposes :)
		assert.strictEqual(typeof options.permissionsRequired['*'], 'object');
		// @ts-expect-error -for test purposes :)
		assert.strictEqual(options.permissionsRequired['*'].permissions instanceof Array, true);
		// @ts-expect-error -for test purposes :)
		assert.strictEqual(options.permissionsRequired['*'].permissions.includes('invalid'), true);
	});

	it('should return true and modify options.permissionsRequired when permissionsRequired key is an object (of permissions)', () => {
		const options = {
			permissionsRequired: {
				GET: ['invalid', 'invalid2'],
			},
		};

		assert.strictEqual(checkPermissions(options), true);
		assert.strictEqual(typeof options.permissionsRequired, 'object');
		assert.strictEqual(options.permissionsRequired.hasOwnProperty('GET'), true);
		assert.strictEqual(typeof options.permissionsRequired.GET, 'object');
		// @ts-expect-error -for test purposes :)
		assert.strictEqual(options.permissionsRequired.GET.operation, 'hasAll');
		// @ts-expect-error -for test purposes :)
		assert.strictEqual(options.permissionsRequired.GET.permissions instanceof Array, true);
		// @ts-expect-error -for test purposes :)
		assert.strictEqual(options.permissionsRequired.GET.permissions.includes('invalid'), true);
	});

	it('should return true and not modify options.permissionsRequired when its of new format', () => {
		const options: { permissionsRequired: PermissionsPayload } = {
			permissionsRequired: {
				GET: {
					operation: 'hasAll',
					permissions: ['invalid', 'invalid2'],
				},
			},
		};

		assert.strictEqual(checkPermissions(options), true);
		assert.strictEqual(typeof options.permissionsRequired, 'object');
		assert.strictEqual(options.permissionsRequired.hasOwnProperty('GET'), true);
		assert.strictEqual(typeof options.permissionsRequired.GET, 'object');
		assert.strictEqual((options.permissionsRequired.GET as { operation: string }).operation, 'hasAll');
		assert.strictEqual(Array.isArray(options.permissionsRequired.GET?.permissions), true);
		assert.strictEqual(options.permissionsRequired.GET?.permissions?.includes('invalid'), true);
	});

	it('should persist the right operation for method', () => {
		const options: { permissionsRequired: PermissionsPayload } = {
			permissionsRequired: {
				GET: {
					operation: 'hasAny',
					permissions: ['invalid', 'invalid2'],
				},
			},
		};

		assert.strictEqual(checkPermissions(options), true);
		assert.strictEqual(typeof options.permissionsRequired, 'object');
		assert.strictEqual(options.permissionsRequired.hasOwnProperty('GET'), true);
		assert.strictEqual(typeof options.permissionsRequired.GET, 'object');
		assert.strictEqual((options.permissionsRequired.GET as { operation: string }).operation, 'hasAny');
		assert.strictEqual(Array.isArray(options.permissionsRequired.GET?.permissions), true);
		assert.strictEqual(options.permissionsRequired.GET?.permissions?.includes('invalid'), true);
	});

	it('should persist the right method keys', () => {
		const options: { permissionsRequired: PermissionsPayload } = {
			permissionsRequired: {
				GET: {
					operation: 'hasAll',
					permissions: ['invalid', 'invalid2'],
				},
				POST: {
					operation: 'hasAll',
					permissions: ['invalid', 'invalid2'],
				},
			},
		};

		assert.strictEqual(checkPermissions(options), true);
		assert.strictEqual(typeof options.permissionsRequired, 'object');
		assert.strictEqual(options.permissionsRequired.hasOwnProperty('GET'), true);
		assert.strictEqual(options.permissionsRequired.hasOwnProperty('POST'), true);
		assert.strictEqual(typeof options.permissionsRequired.GET, 'object');
		assert.strictEqual((options.permissionsRequired.GET as { operation: string }).operation, 'hasAll');
		assert.strictEqual(Array.isArray(options.permissionsRequired.GET?.permissions), true);
		assert.strictEqual(options.permissionsRequired.GET?.permissions?.includes('invalid'), true);
	});
});

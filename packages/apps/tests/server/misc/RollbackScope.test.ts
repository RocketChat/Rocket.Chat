import * as assert from 'node:assert';
import { afterEach, describe, it, mock } from 'node:test';

import { RollbackScope } from '../../../src/server/misc/RollbackScope';

describe('RollbackScope', () => {
	afterEach(() => {
		mock.restoreAll();
	});

	it('runs the steps in reverse order', async () => {
		const calls: Array<string> = [];
		const scope = new RollbackScope('test');

		scope.defer('first', async () => {
			calls.push('first');
		});
		scope.defer('second', async () => {
			calls.push('second');
		});

		await scope.unwind();

		assert.deepStrictEqual(calls, ['second', 'first']);
	});

	it('runs the steps one at a time', async () => {
		const calls: Array<string> = [];
		const scope = new RollbackScope('test');

		scope.defer('slow', async () => {
			await new Promise((resolve) => {
				setTimeout(resolve, 20);
			});

			calls.push('slow');
		});
		scope.defer('fast', async () => {
			calls.push('fast');
		});

		await scope.unwind();

		assert.deepStrictEqual(calls, ['fast', 'slow']);
	});

	it('runs nothing after a commit', async () => {
		const calls: Array<string> = [];
		const scope = new RollbackScope('test');

		scope.defer('step', async () => {
			calls.push('step');
		});
		scope.commit();

		await scope.unwind();

		assert.deepStrictEqual(calls, []);
	});

	it('rejects a step that arrives after a commit', () => {
		const scope = new RollbackScope('test');

		scope.commit();

		assert.throws(() => scope.defer('late', async () => undefined), {
			message: 'Can not add the step "late" to a committed rollback scope',
		});
	});

	it('runs the remaining steps when a step fails, and reports the failure', async () => {
		const calls: Array<string> = [];
		const consoleError = mock.method(console, 'error', () => undefined);
		const cause = new Error('the storage is down');
		const scope = new RollbackScope('installation of the app');

		scope.defer('first', async () => {
			calls.push('first');
		});
		scope.defer('second', async () => {
			throw cause;
		});
		scope.defer('third', async () => {
			calls.push('third');
		});

		await scope.unwind();

		assert.deepStrictEqual(calls, ['third', 'first']);
		assert.strictEqual(consoleError.mock.callCount(), 1);

		const [reported] = consoleError.mock.calls[0].arguments as [AggregateError];
		assert.ok(reported instanceof AggregateError);
		assert.strictEqual(reported.message, 'installation of the app: the rollback did not complete');
		assert.strictEqual(reported.errors.length, 1);
		assert.strictEqual(reported.errors[0].message, 'Rollback step "second" failed');
		assert.strictEqual(reported.errors[0].cause, cause);
	});

	it('reports nothing when every step succeeds', async () => {
		const consoleError = mock.method(console, 'error', () => undefined);
		const scope = new RollbackScope('test');

		scope.defer('step', async () => undefined);

		await scope.unwind();

		assert.strictEqual(consoleError.mock.callCount(), 0);
	});

	it('runs a step only once', async () => {
		const calls: Array<string> = [];
		const scope = new RollbackScope('test');

		scope.defer('step', async () => {
			calls.push('step');
		});

		await scope.unwind();
		await scope.unwind();

		assert.deepStrictEqual(calls, ['step']);
	});
});

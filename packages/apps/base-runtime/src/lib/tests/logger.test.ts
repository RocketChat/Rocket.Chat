import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { Logger } from '../logger';

describe('Logger', () => {
	it('getLogs should return an array of entries', () => {
		const logger = new Logger('test');
		logger.info('test');
		const logs = logger.getLogs();
		assert.deepStrictEqual(logs.entries.length, 1);
		assert.deepStrictEqual(logs.method, 'test');
	});

	it('should be able to add entries of different severity', () => {
		const logger = new Logger('test');
		logger.info('test');
		logger.debug('test');
		logger.error('test');
		const logs = logger.getLogs();
		assert.deepStrictEqual(logs.entries.length, 3);
		assert.deepStrictEqual(logs.entries[0].severity, 'info');
		assert.deepStrictEqual(logs.entries[1].severity, 'debug');
		assert.deepStrictEqual(logs.entries[2].severity, 'error');
	});

	it('should be able to add an info entry', () => {
		const logger = new Logger('test');
		logger.info('test');
		const logs = logger.getLogs();
		assert.deepStrictEqual(logs.entries.length, 1);
		assert.deepStrictEqual(logs.entries[0].args[0], 'test');
		assert.deepStrictEqual(logs.entries[0].method, 'test');
		assert.deepStrictEqual(logs.entries[0].severity, 'info');
	});

	it('should be able to add an debug entry', () => {
		const logger = new Logger('test');
		logger.debug('test');
		const logs = logger.getLogs();
		assert.deepStrictEqual(logs.entries.length, 1);
		assert.deepStrictEqual(logs.entries[0].args[0], 'test');
		assert.deepStrictEqual(logs.entries[0].method, 'test');
		assert.deepStrictEqual(logs.entries[0].severity, 'debug');
	});

	it('should be able to add an error entry', () => {
		const logger = new Logger('test');
		logger.error('test');
		const logs = logger.getLogs();
		assert.deepStrictEqual(logs.entries.length, 1);
		assert.deepStrictEqual(logs.entries[0].args[0], 'test');
		assert.deepStrictEqual(logs.entries[0].method, 'test');
		assert.deepStrictEqual(logs.entries[0].severity, 'error');
	});

	it('should be able to add an success entry', () => {
		const logger = new Logger('test');
		logger.success('test');
		const logs = logger.getLogs();
		assert.deepStrictEqual(logs.entries.length, 1);
		assert.deepStrictEqual(logs.entries[0].args[0], 'test');
		assert.deepStrictEqual(logs.entries[0].method, 'test');
		assert.deepStrictEqual(logs.entries[0].severity, 'success');
	});

	it('should be able to add an warning entry', () => {
		const logger = new Logger('test');
		logger.warn('test');
		const logs = logger.getLogs();
		assert.deepStrictEqual(logs.entries.length, 1);
		assert.deepStrictEqual(logs.entries[0].args[0], 'test');
		assert.deepStrictEqual(logs.entries[0].method, 'test');
		assert.deepStrictEqual(logs.entries[0].severity, 'warning');
	});

	it('should be able to add an log entry', () => {
		const logger = new Logger('test');
		logger.log('test');
		const logs = logger.getLogs();
		assert.deepStrictEqual(logs.entries.length, 1);
		assert.deepStrictEqual(logs.entries[0].args[0], 'test');
		assert.deepStrictEqual(logs.entries[0].method, 'test');
		assert.deepStrictEqual(logs.entries[0].severity, 'log');
	});

	it('should be able to add an entry with multiple arguments', () => {
		const logger = new Logger('test');
		logger.log('test', 'test', 'test');
		const logs = logger.getLogs();
		assert.deepStrictEqual(logs.entries.length, 1);
		assert.deepStrictEqual(logs.entries[0].args[0], 'test');
		assert.deepStrictEqual(logs.entries[0].args[1], 'test');
		assert.deepStrictEqual(logs.entries[0].args[2], 'test');
		assert.deepStrictEqual(logs.entries[0].method, 'test');
		assert.deepStrictEqual(logs.entries[0].severity, 'log');
	});

	it('should be able to add an entry with multiple arguments of different types', () => {
		const logger = new Logger('test');
		logger.log('test', 1, true, { foo: 'bar' });
		const logs = logger.getLogs();
		assert.deepStrictEqual(logs.entries.length, 1);
		assert.deepStrictEqual(logs.entries[0].args[0], 'test');
		assert.deepStrictEqual(logs.entries[0].args[1], 1);
		assert.deepStrictEqual(logs.entries[0].args[2], true);
		assert.deepStrictEqual(logs.entries[0].args[3], { foo: 'bar' });
		assert.deepStrictEqual(logs.entries[0].method, 'test');
		assert.deepStrictEqual(logs.entries[0].severity, 'log');
	});
});

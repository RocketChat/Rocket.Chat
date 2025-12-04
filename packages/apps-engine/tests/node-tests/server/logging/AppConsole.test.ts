import * as assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import type * as stackTrace from 'stack-trace';

import { LogMessageSeverity } from '../../../../src/definition/accessors';
import { AppMethod } from '../../../../src/definition/metadata';
import { AppConsole } from '../../../../src/server/logging';

describe('AppConsole', () => {
	it('basicConsoleMethods', () => {
		assert.doesNotThrow(() => new AppConsole(AppMethod._CONSTRUCTOR));

		const logger = new AppConsole(AppMethod._CONSTRUCTOR);
		const { entries } = logger as any;

		assert.doesNotThrow(() => logger.debug('this is a debug'));
		assert.strictEqual(entries.length, 1);
		assert.strictEqual(entries[0].severity, LogMessageSeverity.DEBUG);
		assert.strictEqual(entries[0].args[0], 'this is a debug');

		assert.doesNotThrow(() => logger.info('this is an info log'));
		assert.strictEqual(entries.length, 2);
		assert.strictEqual(entries[1].severity, LogMessageSeverity.INFORMATION);
		assert.strictEqual(entries[1].args[0], 'this is an info log');

		assert.doesNotThrow(() => logger.log('this is a log'));
		assert.strictEqual(entries.length, 3);
		assert.strictEqual(entries[2].severity, LogMessageSeverity.LOG);
		assert.strictEqual(entries[2].args[0], 'this is a log');

		assert.doesNotThrow(() => logger.warn('this is a warn'));
		assert.strictEqual(entries.length, 4);
		assert.strictEqual(entries[3].severity, LogMessageSeverity.WARNING);
		assert.strictEqual(entries[3].args[0], 'this is a warn');

		const e = new Error('just a test');
		assert.doesNotThrow(() => logger.error(e));
		assert.strictEqual(entries.length, 5);
		assert.strictEqual(entries[4].severity, LogMessageSeverity.ERROR);
		assert.strictEqual(entries[4].args[0], JSON.stringify(e, Object.getOwnPropertyNames(e)));

		assert.doesNotThrow(() => logger.success('this is a success'));
		assert.strictEqual(entries.length, 6);
		assert.strictEqual(entries[5].severity, LogMessageSeverity.SUCCESS);
		assert.strictEqual(entries[5].args[0], 'this is a success');

		assert.doesNotThrow(() => {
			class Item {
				constructor() {
					logger.debug('inside');
				}
			}

			return new Item();
		});

		assert.deepStrictEqual(logger.getEntries(), entries);
		assert.strictEqual(logger.getMethod(), AppMethod._CONSTRUCTOR);
		assert.ok(logger.getStartTime() !== undefined);
		assert.ok(logger.getEndTime() !== undefined);
		assert.ok(logger.getTotalTime() > 1);

		const getFuncSpy = mock.method(logger, 'getFunc');
		getFuncSpy.mock.mockImplementationOnce(() => 'anonymous');
		assert.strictEqual(getFuncSpy.call([{} as stackTrace.StackFrame]), 'anonymous');
		
		const mockFrames = [];
		mockFrames.push({} as stackTrace.StackFrame);
		mockFrames.push({
			getMethodName() {
				return 'testing';
			},
			getFunctionName() {
				return null;
			},
		} as stackTrace.StackFrame);
		getFuncSpy.mock.mockImplementationOnce(() => 'testing');
		assert.strictEqual(getFuncSpy.call(mockFrames), 'testing');

		assert.ok(AppConsole.toStorageEntry('testing-app', logger) !== undefined); // TODO: better test this
	});
});

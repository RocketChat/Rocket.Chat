import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import * as jsonrpc from '../../jsonrpc';
import { formatErrorResponse } from '../formatResponseErrorHandler';

describe('formatErrorResponse', () => {
	describe('JSON-RPC ErrorObject handling', () => {
		it('formats ErrorObject instances correctly', () => {
			const errorObject = jsonrpc.error('test-id', new jsonrpc.JsonRpcError('Test error message', 1000));
			const result = formatErrorResponse(errorObject);

			assert.ok(result instanceof Error, `Expected instance of Error`);
			assert.deepStrictEqual(result.message, 'Test error message');
		});

		it('formats objects with error.message structure', () => {
			const errorLikeObject = {
				error: {
					message: 'Custom error message',
					code: 404,
				},
			};
			const result = formatErrorResponse(errorLikeObject);

			assert.ok(result instanceof Error, `Expected instance of Error`);
			assert.deepStrictEqual(result.message, 'Custom error message');
		});

		it('handles nested error objects with complex structure', () => {
			const complexError = {
				error: {
					message: 'Database connection failed',
					details: {
						host: 'localhost',
						port: 5432,
					},
				},
				id: 'req-123',
			};
			const result = formatErrorResponse(complexError);

			assert.ok(result instanceof Error, `Expected instance of Error`);
			assert.deepStrictEqual(result.message, 'Database connection failed');
		});

		it('handles error objects with empty message', () => {
			const emptyMessageError = {
				error: {
					message: '',
					code: 500,
				},
			};
			const result = formatErrorResponse(emptyMessageError);

			assert.ok(result instanceof Error, `Expected instance of Error`);
			assert.deepStrictEqual(result.message, '');
		});
	});

	describe('Error instance passthrough', () => {
		it('returns existing Error instances unchanged', () => {
			const originalError = new Error('Original error message');
			const result = formatErrorResponse(originalError);

			assert.strictEqual(result, originalError);
			assert.deepStrictEqual(result.message, 'Original error message');
		});

		it('returns custom Error subclasses unchanged', () => {
			class CustomError extends Error {
				constructor(
					message: string,
					public code: number,
				) {
					super(message);
					this.name = 'CustomError';
				}
			}

			const customError = new CustomError('Custom error', 404);
			const result = formatErrorResponse(customError);

			assert.strictEqual(result, customError);
			assert.deepStrictEqual(result.message, 'Custom error');
			assert.deepStrictEqual((result as CustomError).code, 404);
		});

		it('handles Error instances with additional properties', () => {
			const errorWithProps = new Error('Error with props') as any;
			errorWithProps.statusCode = 500;
			errorWithProps.details = { reason: 'timeout' };

			const result = formatErrorResponse(errorWithProps);

			assert.strictEqual(result, errorWithProps);
			assert.deepStrictEqual(result.message, 'Error with props');
			assert.deepStrictEqual((result as any).statusCode, 500);
		});
	});

	describe('Unknown error handling', () => {
		it('wraps string errors with default message and cause', () => {
			const stringError = 'Simple string error';
			const result = formatErrorResponse(stringError);

			assert.ok(result instanceof Error, `Expected instance of Error`);
			assert.deepStrictEqual(result.message, 'An unknown error occurred');
			assert.deepStrictEqual(result.cause, stringError);
		});

		it('wraps number errors with default message and cause', () => {
			const numberError = 404;
			const result = formatErrorResponse(numberError);

			assert.ok(result instanceof Error, `Expected instance of Error`);
			assert.deepStrictEqual(result.message, 'An unknown error occurred');
			assert.deepStrictEqual(result.cause, numberError);
		});

		it('wraps boolean errors with default message and cause', () => {
			const booleanError = false;
			const result = formatErrorResponse(booleanError);

			assert.ok(result instanceof Error, `Expected instance of Error`);
			assert.deepStrictEqual(result.message, 'An unknown error occurred');
			assert.deepStrictEqual(result.cause, booleanError);
		});

		it('wraps null with default message and cause', () => {
			const result = formatErrorResponse(null);

			assert.ok(result instanceof Error, `Expected instance of Error`);
			assert.deepStrictEqual(result.message, 'An unknown error occurred');
			assert.deepStrictEqual(result.cause, null);
		});

		it('wraps undefined with default message and cause', () => {
			const result = formatErrorResponse(undefined);

			assert.ok(result instanceof Error, `Expected instance of Error`);
			assert.deepStrictEqual(result.message, 'An unknown error occurred');
			assert.deepStrictEqual(result.cause, undefined);
		});

		it('wraps arrays with default message and cause', () => {
			const arrayError = ['error', 'details'];
			const result = formatErrorResponse(arrayError);

			assert.ok(result instanceof Error, `Expected instance of Error`);
			assert.deepStrictEqual(result.message, 'An unknown error occurred');
			assert.deepStrictEqual(result.cause, arrayError);
		});

		it('wraps functions with default message and cause', () => {
			const functionError = () => 'error';
			const result = formatErrorResponse(functionError);

			assert.ok(result instanceof Error, `Expected instance of Error`);
			assert.deepStrictEqual(result.message, 'An unknown error occurred');
			assert.deepStrictEqual(result.cause, functionError);
		});

		it('wraps plain objects without error.message with default message and cause', () => {
			const plainObject = {
				status: 'failed',
				reason: 'timeout',
				data: { id: 123 },
			};
			const result = formatErrorResponse(plainObject);

			assert.ok(result instanceof Error, `Expected instance of Error`);
			assert.deepStrictEqual(result.message, 'An unknown error occurred');
			assert.deepStrictEqual(result.cause, plainObject);
		});

		it('wraps objects with error property but no message with default message and cause', () => {
			const errorObjectNoMessage = {
				error: {
					code: 500,
					details: 'Internal server error',
				},
			};
			const result = formatErrorResponse(errorObjectNoMessage);

			assert.ok(result instanceof Error, `Expected instance of Error`);
			assert.deepStrictEqual(result.message, 'An unknown error occurred');
			assert.deepStrictEqual(result.cause, errorObjectNoMessage);
		});
	});

	it('ensures all returned values are proper Error instances', () => {
		const testCases = ['string error', 123, null, undefined, { error: { message: 'test' } }, new Error('test'), { plain: 'object' }];

		for (const testCase of testCases) {
			const result = formatErrorResponse(testCase);
			assert.ok(result instanceof Error, `Failed for input: ${JSON.stringify(testCase)}`);
		}
	});

	it('prevents "[object Object]" error messages for plain objects', () => {
		const plainObject = { status: 'error', code: 500 };
		const result = formatErrorResponse(plainObject);

		assert.ok(result instanceof Error, `Expected instance of Error`);
		assert.deepStrictEqual(result.message, 'An unknown error occurred');
		// Ensure the message is not "[object Object]"
		assert.deepStrictEqual((result.message as string) !== '[object Object]', true);
	});
});

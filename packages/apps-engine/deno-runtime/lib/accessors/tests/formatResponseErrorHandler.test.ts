// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertInstanceOf, assertStrictEquals } from 'https://deno.land/std@0.203.0/assert/mod.ts';
import { describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';
import * as jsonrpc from 'jsonrpc-lite';

import { formatErrorResponse } from '../formatResponseErrorHandler.ts';

describe('formatErrorResponse', () => {
    describe('JSON-RPC ErrorObject handling', () => {
        it('formats ErrorObject instances correctly', () => {
            const errorObject = jsonrpc.error('test-id', new jsonrpc.JsonRpcError('Test error message', 1000));
            const result = formatErrorResponse(errorObject);

            assertInstanceOf(result, Error);
            assertEquals(result.message, 'Test error message');
        });

        it('formats objects with error.message structure', () => {
            const errorLikeObject = {
                error: {
                    message: 'Custom error message',
                    code: 404,
                },
            };
            const result = formatErrorResponse(errorLikeObject);

            assertInstanceOf(result, Error);
            assertEquals(result.message, 'Custom error message');
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

            assertInstanceOf(result, Error);
            assertEquals(result.message, 'Database connection failed');
        });

        it('handles error objects with empty message', () => {
            const emptyMessageError = {
                error: {
                    message: '',
                    code: 500,
                },
            };
            const result = formatErrorResponse(emptyMessageError);

            assertInstanceOf(result, Error);
            assertEquals(result.message, '');
        });
    });

    describe('Error instance passthrough', () => {
        it('returns existing Error instances unchanged', () => {
            const originalError = new Error('Original error message');
            const result = formatErrorResponse(originalError);

            assertStrictEquals(result, originalError);
            assertEquals(result.message, 'Original error message');
        });

        it('returns custom Error subclasses unchanged', () => {
            class CustomError extends Error {
                constructor(message: string, public code: number) {
                    super(message);
                    this.name = 'CustomError';
                }
            }

            const customError = new CustomError('Custom error', 404);
            const result = formatErrorResponse(customError);

            assertStrictEquals(result, customError);
            assertEquals(result.message, 'Custom error');
            assertEquals((result as CustomError).code, 404);
        });

        it('handles Error instances with additional properties', () => {
            const errorWithProps = new Error('Error with props') as any;
            errorWithProps.statusCode = 500;
            errorWithProps.details = { reason: 'timeout' };

            const result = formatErrorResponse(errorWithProps);

            assertStrictEquals(result, errorWithProps);
            assertEquals(result.message, 'Error with props');
            assertEquals((result as any).statusCode, 500);
        });
    });

    describe('Unknown error handling', () => {
        it('wraps string errors with default message and cause', () => {
            const stringError = 'Simple string error';
            const result = formatErrorResponse(stringError);

            assertInstanceOf(result, Error);
            assertEquals(result.message, 'An unknown error occurred');
            assertEquals(result.cause, stringError);
        });

        it('wraps number errors with default message and cause', () => {
            const numberError = 404;
            const result = formatErrorResponse(numberError);

            assertInstanceOf(result, Error);
            assertEquals(result.message, 'An unknown error occurred');
            assertEquals(result.cause, numberError);
        });

        it('wraps boolean errors with default message and cause', () => {
            const booleanError = false;
            const result = formatErrorResponse(booleanError);

            assertInstanceOf(result, Error);
            assertEquals(result.message, 'An unknown error occurred');
            assertEquals(result.cause, booleanError);
        });

        it('wraps null with default message and cause', () => {
            const result = formatErrorResponse(null);

            assertInstanceOf(result, Error);
            assertEquals(result.message, 'An unknown error occurred');
            assertEquals(result.cause, null);
        });

        it('wraps undefined with default message and cause', () => {
            const result = formatErrorResponse(undefined);

            assertInstanceOf(result, Error);
            assertEquals(result.message, 'An unknown error occurred');
            assertEquals(result.cause, undefined);
        });

        it('wraps arrays with default message and cause', () => {
            const arrayError = ['error', 'details'];
            const result = formatErrorResponse(arrayError);

            assertInstanceOf(result, Error);
            assertEquals(result.message, 'An unknown error occurred');
            assertEquals(result.cause, arrayError);
        });

        it('wraps functions with default message and cause', () => {
            const functionError = () => 'error';
            const result = formatErrorResponse(functionError);

            assertInstanceOf(result, Error);
            assertEquals(result.message, 'An unknown error occurred');
            assertEquals(result.cause, functionError);
        });

        it('wraps plain objects without error.message with default message and cause', () => {
            const plainObject = {
                status: 'failed',
                reason: 'timeout',
                data: { id: 123 },
            };
            const result = formatErrorResponse(plainObject);

            assertInstanceOf(result, Error);
            assertEquals(result.message, 'An unknown error occurred');
            assertEquals(result.cause, plainObject);
        });

        it('wraps objects with error property but no message with default message and cause', () => {
            const errorObjectNoMessage = {
                error: {
                    code: 500,
                    details: 'Internal server error',
                },
            };
            const result = formatErrorResponse(errorObjectNoMessage);

            assertInstanceOf(result, Error);
            assertEquals(result.message, 'An unknown error occurred');
            assertEquals(result.cause, errorObjectNoMessage);
        });
    });

    it('ensures all returned values are proper Error instances', () => {
        const testCases = [
            'string error',
            123,
            null,
            undefined,
            { error: { message: 'test' } },
            new Error('test'),
            { plain: 'object' },
        ];

        for (const testCase of testCases) {
            const result = formatErrorResponse(testCase);
            assertInstanceOf(result, Error, `Failed for input: ${JSON.stringify(testCase)}`);
        }
    });

    it('prevents "[object Object]" error messages for plain objects', () => {
        const plainObject = { status: 'error', code: 500 };
        const result = formatErrorResponse(plainObject);

        assertInstanceOf(result, Error);
        assertEquals(result.message, 'An unknown error occurred');
        // Ensure the message is not "[object Object]"
        assertEquals(result.message !== '[object Object]', true);
    });
});

// deno-lint-ignore-file no-explicit-any
import { assertRejects } from 'https://deno.land/std@0.203.0/assert/mod.ts';
import { beforeEach, describe, it, afterAll } from 'https://deno.land/std@0.203.0/testing/bdd.ts';

import { Http } from '../http.ts';
import { AppObjectRegistry } from '../../../AppObjectRegistry.ts';
import { stub } from 'https://deno.land/std@0.203.0/testing/mock.ts';

describe('Http accessor error handling integration', () => {
	let http: Http;

	beforeEach(() => {
		AppObjectRegistry.clear();
		AppObjectRegistry.set('id', 'test-app-id');

		const mockHttpExtend = {
			getDefaultHeaders: () => new Map(),
			getDefaultParams: () => new Map(),
			getPreRequestHandlers: () => [],
			getPreResponseHandlers: () => [],
		};

		const mockRead = {};
		const mockPersistence = {};

		http = new Http(mockRead as any, mockPersistence as any, mockHttpExtend as any, () => Promise.resolve({}) as any);
	});

	afterAll(() => {
		AppObjectRegistry.clear();
	});

	describe('HTTP method error handling', () => {
		it('formats JSON-RPC errors correctly for GET requests', async () => {
			const _stub = stub(http, 'senderFn' as keyof Http, () =>
				Promise.reject({
					error: {
						message: 'HTTP GET request failed',
						code: 404,
					},
				}),
			);

			await assertRejects(() => http.get('https://api.example.com/data'), Error, 'HTTP GET request failed');

			_stub.restore();
		});

		it('formats JSON-RPC errors correctly for POST requests', async () => {
			const _stub = stub(http, 'senderFn' as keyof Http, () =>
				Promise.reject({
					error: {
						message: 'HTTP POST request validation failed',
						code: 400,
					},
				}),
			);

			await assertRejects(
				() => http.post('https://api.example.com/create', { data: { name: 'test' } }),
				Error,
				'HTTP POST request validation failed',
			);

			_stub.restore();
		});

		it('formats JSON-RPC errors correctly for PUT requests', async () => {
			const _stub = stub(http, 'senderFn' as keyof Http, () =>
				Promise.reject({
					error: {
						message: 'HTTP PUT request unauthorized',
						code: 401,
					},
				}),
			);

			await assertRejects(
				() => http.put('https://api.example.com/update/123', { data: { name: 'updated' } }),
				Error,
				'HTTP PUT request unauthorized',
			);

			_stub.restore();
		});

		it('formats JSON-RPC errors correctly for DELETE requests', async () => {
			const _stub = stub(http, 'senderFn' as keyof Http, () =>
				Promise.reject({
					error: {
						message: 'HTTP DELETE request forbidden',
						code: 403,
					},
				}),
			);

			await assertRejects(() => http.del('https://api.example.com/delete/123'), Error, 'HTTP DELETE request forbidden');

			_stub.restore();
		});

		it('formats JSON-RPC errors correctly for PATCH requests', async () => {
			const _stub = stub(http, 'senderFn' as keyof Http, () =>
				Promise.reject({
					error: {
						message: 'HTTP PATCH request conflict',
						code: 409,
					},
				}),
			);

			await assertRejects(
				() => http.patch('https://api.example.com/patch/123', { data: { status: 'active' } }),
				Error,
				'HTTP PATCH request conflict',
			);

			_stub.restore();
		});
	});

	describe('Error instance passthrough', () => {
		it('passes through existing Error instances unchanged for HTTP requests', async () => {
			const originalError = new Error('Network timeout error');
			const _stub = stub(http, 'senderFn' as keyof Http, () => Promise.reject(originalError));

			await assertRejects(() => http.get('https://api.example.com/data'), Error, 'Network timeout error');

			_stub.restore();
		});
	});

	describe('Unknown error handling', () => {
		it('wraps unknown object errors with default message for HTTP requests', async () => {
			const unknownError = {
				status: 'failed',
				details: 'Something went wrong',
				timestamp: Date.now(),
			};
			const _stub = stub(http, 'senderFn' as keyof Http, () => Promise.reject(unknownError));

			await assertRejects(() => http.get('https://api.example.com/data'), Error, 'An unknown error occurred');

			_stub.restore();
		});

		it('wraps string errors with default message for HTTP requests', async () => {
			const stringError = 'Connection refused';
			const _stub = stub(http, 'senderFn' as keyof Http, () => Promise.reject(stringError));

			await assertRejects(() => http.get('https://api.example.com/data'), Error, 'An unknown error occurred');

			_stub.restore();
		});

		it('wraps null/undefined errors with default message for HTTP requests', async () => {
			const _stub = stub(http, 'senderFn' as keyof Http, () => Promise.reject(null));

			await assertRejects(() => http.get('https://api.example.com/data'), Error, 'An unknown error occurred');

			_stub.restore();
		});
	});
});

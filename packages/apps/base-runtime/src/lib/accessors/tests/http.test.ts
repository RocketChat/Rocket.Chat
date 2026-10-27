import * as assert from 'node:assert';
import { beforeEach, describe, it, after, mock } from 'node:test';

import { AppObjectRegistry } from '../../../AppObjectRegistry';
import { Http } from '../http';

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

	after(() => {
		AppObjectRegistry.clear();
	});

	describe('HTTP method error handling', () => {
		it('formats JSON-RPC errors correctly for GET requests', async () => {
			const _stub = mock.method(http, 'senderFn' as any, () =>
				Promise.reject({
					error: {
						message: 'HTTP GET request failed',
						code: 404,
					},
				}),
			);

			await assert.rejects(() => http.get('https://api.example.com/data'), { message: 'HTTP GET request failed' });

			_stub.mock.restore();
		});

		it('formats JSON-RPC errors correctly for POST requests', async () => {
			const _stub = mock.method(http, 'senderFn' as any, () =>
				Promise.reject({
					error: {
						message: 'HTTP POST request validation failed',
						code: 400,
					},
				}),
			);

			await assert.rejects(() => http.post('https://api.example.com/create', { data: { name: 'test' } }), {
				message: 'HTTP POST request validation failed',
			});

			_stub.mock.restore();
		});

		it('formats JSON-RPC errors correctly for PUT requests', async () => {
			const _stub = mock.method(http, 'senderFn' as any, () =>
				Promise.reject({
					error: {
						message: 'HTTP PUT request unauthorized',
						code: 401,
					},
				}),
			);

			await assert.rejects(() => http.put('https://api.example.com/update/123', { data: { name: 'updated' } }), {
				message: 'HTTP PUT request unauthorized',
			});

			_stub.mock.restore();
		});

		it('formats JSON-RPC errors correctly for DELETE requests', async () => {
			const _stub = mock.method(http, 'senderFn' as any, () =>
				Promise.reject({
					error: {
						message: 'HTTP DELETE request forbidden',
						code: 403,
					},
				}),
			);

			await assert.rejects(() => http.del('https://api.example.com/delete/123'), { message: 'HTTP DELETE request forbidden' });

			_stub.mock.restore();
		});

		it('formats JSON-RPC errors correctly for PATCH requests', async () => {
			const _stub = mock.method(http, 'senderFn' as any, () =>
				Promise.reject({
					error: {
						message: 'HTTP PATCH request conflict',
						code: 409,
					},
				}),
			);

			await assert.rejects(() => http.patch('https://api.example.com/patch/123', { data: { status: 'active' } }), {
				message: 'HTTP PATCH request conflict',
			});

			_stub.mock.restore();
		});
	});

	describe('Error instance passthrough', () => {
		it('passes through existing Error instances unchanged for HTTP requests', async () => {
			const originalError = new Error('Network timeout error');
			const _stub = mock.method(http, 'senderFn' as any, () => Promise.reject(originalError));

			await assert.rejects(() => http.get('https://api.example.com/data'), { message: 'Network timeout error' });

			_stub.mock.restore();
		});
	});

	describe('Unknown error handling', () => {
		it('wraps unknown object errors with default message for HTTP requests', async () => {
			const unknownError = {
				status: 'failed',
				details: 'Something went wrong',
				timestamp: Date.now(),
			};
			const _stub = mock.method(http, 'senderFn' as any, () => Promise.reject(unknownError));

			await assert.rejects(() => http.get('https://api.example.com/data'), { message: 'An unknown error occurred' });

			_stub.mock.restore();
		});

		it('wraps string errors with default message for HTTP requests', async () => {
			const stringError = 'Connection refused';
			const _stub = mock.method(http, 'senderFn' as any, () => Promise.reject(stringError));

			await assert.rejects(() => http.get('https://api.example.com/data'), { message: 'An unknown error occurred' });

			_stub.mock.restore();
		});

		it('wraps null/undefined errors with default message for HTTP requests', async () => {
			const _stub = mock.method(http, 'senderFn' as any, () => Promise.reject(null));

			await assert.rejects(() => http.get('https://api.example.com/data'), { message: 'An unknown error occurred' });

			_stub.mock.restore();
		});
	});
});

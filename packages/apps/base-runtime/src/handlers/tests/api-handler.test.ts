import * as assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';

import type { IRead, IModify, IHttp, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import type { IApiRequest, IApiEndpointInfo, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import type { IApiEndpoint } from '@rocket.chat/apps-engine/definition/api/IApiEndpoint';
import { JsonRpcError } from 'jsonrpc-lite';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import apiHandler from '../api-handler';
import { createMockRequest } from './helpers/mod';

describe('handlers > api', () => {
	const mockEndpoint: Required<Omit<IApiEndpoint, 'delete'>> = {
		path: '/test',
		examples: {},
		authRequired: false,
		_availableMethods: [],
		get(
			_request: IApiRequest,
			_endpoint: IApiEndpointInfo,
			_read: IRead,
			_modify: IModify,
			_http: IHttp,
			_persis: IPersistence,
		): Promise<IApiResponse> {
			return Promise.resolve({ status: 200 });
		},
		post(
			_request: IApiRequest,
			_endpoint: IApiEndpointInfo,
			_read: IRead,
			_modify: IModify,
			_http: IHttp,
			_persis: IPersistence,
		): Promise<IApiResponse> {
			return Promise.resolve({ status: 200 });
		},
		put(
			_request: IApiRequest,
			_endpoint: IApiEndpointInfo,
			_read: IRead,
			_modify: IModify,
			_http: IHttp,
			_persis: IPersistence,
		): Promise<IApiResponse> {
			throw new Error('Method execution error example');
		},
		head(
			_request: IApiRequest,
			_endpoint: IApiEndpointInfo,
			_read: IRead,
			_modify: IModify,
			_http: IHttp,
			_persis: IPersistence,
		): Promise<IApiResponse> {
			throw new Error('Function not implemented.');
		},
		options(
			_request: IApiRequest,
			_endpoint: IApiEndpointInfo,
			_read: IRead,
			_modify: IModify,
			_http: IHttp,
			_persis: IPersistence,
		): Promise<IApiResponse> {
			throw new Error('Function not implemented.');
		},
		patch(
			_request: IApiRequest,
			_endpoint: IApiEndpointInfo,
			_read: IRead,
			_modify: IModify,
			_http: IHttp,
			_persis: IPersistence,
		): Promise<IApiResponse> {
			throw new Error('Function not implemented.');
		},
	};

	beforeEach(() => {
		AppObjectRegistry.clear();
		AppObjectRegistry.set('api:/test', mockEndpoint);
	});

	it('correctly handles execution of an api endpoint method GET', async () => {
		const _spy = mock.method(mockEndpoint, 'get');

		const result = await apiHandler(createMockRequest({ method: 'api:/test:get', params: ['request', 'endpointInfo'] }));

		assert.deepStrictEqual(result, { status: 200 });
		assert.deepStrictEqual(_spy.mock.calls[0].arguments.length, 6);
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[0], 'request');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[1], 'endpointInfo');

		_spy.mock.restore();
	});

	it('correctly handles execution of an api endpoint method POST', async () => {
		const _spy = mock.method(mockEndpoint, 'post');

		const result = await apiHandler(createMockRequest({ method: 'api:/test:post', params: ['request', 'endpointInfo'] }));

		assert.deepStrictEqual(result, { status: 200 });
		assert.deepStrictEqual(_spy.mock.calls[0].arguments.length, 6);
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[0], 'request');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[1], 'endpointInfo');

		_spy.mock.restore();
	});

	it('correctly handles an error if the method not exists for the selected endpoint', async () => {
		const result = await apiHandler(createMockRequest({ method: `api:/test:delete`, params: ['request', 'endpointInfo'] }));

		assert.ok(result instanceof JsonRpcError, `Expected instance of ${JsonRpcError.name}`);
		assert.strictEqual(result.message, `/test's delete not exists`);
		assert.strictEqual(result.code, -32000);
	});

	it('correctly handles an error if endpoint not exists', async () => {
		const result = await apiHandler(createMockRequest({ method: `api:/error:get`, params: ['request', 'endpointInfo'] }));

		assert.ok(result instanceof JsonRpcError, `Expected instance of ${JsonRpcError.name}`);
		assert.strictEqual((result as any).message, `Endpoint /error not found`);
		assert.strictEqual((result as any).code, -32000);
	});

	it('correctly handles an error if the method execution fails', async () => {
		const result = await apiHandler(createMockRequest({ method: `api:/test:put`, params: ['request', 'endpointInfo'] }));

		assert.ok(result instanceof JsonRpcError, `Expected instance of ${JsonRpcError.name}`);
		assert.strictEqual((result as any).message, `Method execution error example`);
		assert.strictEqual((result as any).code, -32000);
	});

	it('correctly handles dynamic paths with parameters (e.g., webhook/:event)', async () => {
		const mockDynamicEndpoint = {
			...mockEndpoint,
			path: 'webhook/:event',
			post: (_request: any, _endpoint: any, _read: any, _modify: any, _http: any, _persis: any) =>
				Promise.resolve('webhook handled' as any),
		};

		AppObjectRegistry.set('api:webhook/:event', mockDynamicEndpoint);

		const _spy = mock.method(mockDynamicEndpoint, 'post');

		const result = await apiHandler(createMockRequest({ method: 'api:webhook/:event:post', params: ['request', 'endpointInfo'] }));

		assert.deepStrictEqual(result, 'webhook handled');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments.length, 6);
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[0], 'request');
		assert.deepStrictEqual(_spy.mock.calls[0].arguments[1], 'endpointInfo');

		_spy.mock.restore();
	});

	it('correctly handles paths with multiple segments and colons', async () => {
		const mockComplexEndpoint = {
			...mockEndpoint,
			path: 'api/v1/:resource/:id',
			get: (_request: any, _endpoint: any, _read: any, _modify: any, _http: any, _persis: any) => Promise.resolve({ status: 201 }),
		};

		AppObjectRegistry.set('api:api/v1/:resource/:id', mockComplexEndpoint);

		const _spy = mock.method(mockComplexEndpoint, 'get');

		const result = await apiHandler(createMockRequest({ method: 'api:api/v1/:resource/:id:get', params: ['request', 'endpointInfo'] }));

		assert.deepStrictEqual(result, { status: 201 });
		assert.deepStrictEqual(_spy.mock.calls[0].arguments.length, 6);

		_spy.mock.restore();
	});
});

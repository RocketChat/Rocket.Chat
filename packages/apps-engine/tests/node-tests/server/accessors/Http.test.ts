import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type {
	IHttpExtend,
	IHttpPreRequestHandler,
	IHttpPreResponseHandler,
	IHttpRequest,
	IHttpResponse,
	IPersistence,
	IRead,
} from '../../../../src/definition/accessors';
import { Http, HttpExtend } from '../../../../src/server/accessors';
import type { AppBridges, HttpBridge, IHttpBridgeRequestInfo } from '../../../../src/server/bridges';
import type { AppAccessorManager } from '../../../../src/server/managers';

describe('Http', () => {
	let mockAppId: string;
	let mockHttpBridge: HttpBridge;
	let mockAppBridge: AppBridges;
	let mockHttpExtender: IHttpExtend;
	let mockReader: IRead;
	let mockPersis: IPersistence;
	let mockAccessorManager: AppAccessorManager;
	let mockPreRequestHandler: IHttpPreRequestHandler;
	let mockPreResponseHandler: IHttpPreResponseHandler;
	let mockResponse: IHttpResponse;

	beforeEach(() => {
		mockAppId = 'testing-app';

		mockResponse = { statusCode: 200 } as IHttpResponse;
		const res = mockResponse;
		mockHttpBridge = {
			doCall(info: IHttpBridgeRequestInfo): Promise<IHttpResponse> {
				return Promise.resolve(res);
			},
		} as HttpBridge;

		const httpBridge = mockHttpBridge;
		mockAppBridge = {
			getHttpBridge(): HttpBridge {
				return httpBridge;
			},
		} as AppBridges;

		mockHttpExtender = new HttpExtend();

		mockReader = {} as IRead;
		mockPersis = {} as IPersistence;
		const reader = mockReader;
		const persis = mockPersis;
		mockAccessorManager = {
			getReader(appId: string): IRead {
				return reader;
			},
			getPersistence(appId: string): IPersistence {
				return persis;
			},
		} as AppAccessorManager;

		mockPreRequestHandler = {
			executePreHttpRequest(url: string, request: IHttpRequest, read: IRead, persistence: IPersistence): Promise<IHttpRequest> {
				return Promise.resolve(request);
			},
		} as IHttpPreRequestHandler;

		mockPreResponseHandler = {
			executePreHttpResponse(response: IHttpResponse, read: IRead, persistence: IPersistence): Promise<IHttpResponse> {
				return Promise.resolve(response);
			},
		} as IHttpPreResponseHandler;
	});

	afterEach(() => {
		mock.restoreAll();
	});

	it('useHttp', async () => {
		assert.doesNotThrow(() => new Http(mockAccessorManager, mockAppBridge, mockHttpExtender, mockAppId));

		const http = new Http(mockAccessorManager, mockAppBridge, mockHttpExtender, mockAppId);

		const doCallSpy = mock.method(mockHttpBridge, 'doCall');
		const preRequestSpy = mock.method(mockPreRequestHandler, 'executePreHttpRequest');
		const preResponseSpy = mock.method(mockPreResponseHandler, 'executePreHttpResponse');

		assert.ok((await http.get('url-here')) !== undefined);
		assert.ok((await http.post('url-here')) !== undefined);
		assert.ok((await http.put('url-here')) !== undefined);
		assert.ok((await http.del('url-here')) !== undefined);
		assert.ok((await http.get('url-here', { headers: {}, params: {} })) !== undefined);

		const request1 = {} as IHttpRequest;
		mockHttpExtender.provideDefaultHeader('Auth-Token', 'Bearer asdfasdf');
		assert.ok((await http.post('url-here', request1)) !== undefined);
		assert.strictEqual(request1.headers['Auth-Token'], 'Bearer asdfasdf');
		request1.headers['Auth-Token'] = 'mine';
		assert.ok((await http.put('url-here', request1)) !== undefined); // Check that the default doesn't override provided
		assert.strictEqual(request1.headers['Auth-Token'], 'mine');

		const request2 = {} as IHttpRequest;
		mockHttpExtender.provideDefaultParam('count', '20');
		assert.ok((await http.del('url-here', request2)) !== undefined);
		assert.strictEqual(request2.params.count, '20');
		request2.params.count = '50';
		assert.ok((await http.get('url-here', request2)) !== undefined); // Check that the default doesn't override provided
		assert.strictEqual(request2.params.count, '50');

		mockHttpExtender.providePreRequestHandler(mockPreRequestHandler);
		const request3 = {} as IHttpRequest;
		assert.ok((await http.post('url-here', request3)) !== undefined);
		assert.strictEqual(preRequestSpy.mock.calls.length, 1);
		assert.deepStrictEqual(preRequestSpy.mock.calls[0].arguments, ['url-here', request3, mockReader, mockPersis]);
		(mockHttpExtender as any).requests = [];

		mockHttpExtender.providePreResponseHandler(mockPreResponseHandler);
		assert.ok((await http.post('url-here')) !== undefined);
		assert.strictEqual(preResponseSpy.mock.calls.length, 1);
		assert.deepStrictEqual(preResponseSpy.mock.calls[0].arguments, [mockResponse, mockReader, mockPersis]);

		assert.strictEqual(doCallSpy.mock.calls.length, 11);
	});

	it('ssrfValidationOption', async () => {
		const http = new Http(mockAccessorManager, mockAppBridge, mockHttpExtender, mockAppId);

		let capturedInfo: IHttpBridgeRequestInfo | undefined;

		// Override doCall to capture the info parameter
		const originalDoCall = mockHttpBridge.doCall.bind(mockHttpBridge);
		mockHttpBridge.doCall = async (info: IHttpBridgeRequestInfo) => {
			capturedInfo = info;
			return originalDoCall(info);
		};

		// Test with ssrfValidation enabled
		await http.get('url-here', { ssrfValidation: true });
		assert.ok(capturedInfo !== undefined);
		assert.strictEqual(capturedInfo!.request.ssrfValidation, true);

		// Test with ssrfValidation disabled
		await http.post('url-here', { ssrfValidation: false });
		assert.strictEqual(capturedInfo!.request.ssrfValidation, false);

		// Test with ssrfValidation undefined (default)
		await http.put('url-here', {});
		assert.strictEqual(capturedInfo!.request.ssrfValidation, undefined);

		// Test with no options
		await http.del('url-here');
		assert.strictEqual(capturedInfo!.request.ssrfValidation, undefined);
	});
});

import { AsyncTest, Expect, SetupFixture, SpyOn } from 'alsatian';

import type {
    IHttpExtend,
    IHttpPreRequestHandler,
    IHttpPreResponseHandler,
    IHttpRequest,
    IHttpResponse,
    IPersistence,
    IRead,
} from '../../../src/definition/accessors';
import { Http, HttpExtend } from '../../../src/server/accessors';
import type { AppBridges, HttpBridge, IHttpBridgeRequestInfo } from '../../../src/server/bridges';
import type { AppAccessorManager } from '../../../src/server/managers';

export class HttpAccessorTestFixture {
    private mockAppId: string;

    private mockHttpBridge: HttpBridge;

    private mockAppBridge: AppBridges;

    private mockHttpExtender: IHttpExtend;

    private mockReader: IRead;

    private mockPersis: IPersistence;

    private mockAccessorManager: AppAccessorManager;

    private mockPreRequestHandler: IHttpPreRequestHandler;

    private mockPreResponseHandler: IHttpPreResponseHandler;

    private mockResponse: IHttpResponse;

    @SetupFixture
    public setupFixture() {
        this.mockAppId = 'testing-app';

        this.mockResponse = { statusCode: 200 } as IHttpResponse;
        const res = this.mockResponse;
        this.mockHttpBridge = {
            doCall(info: IHttpBridgeRequestInfo): Promise<IHttpResponse> {
                return Promise.resolve(res);
            },
        } as HttpBridge;

        const httpBridge = this.mockHttpBridge;
        this.mockAppBridge = {
            getHttpBridge(): HttpBridge {
                return httpBridge;
            },
        } as AppBridges;

        this.mockHttpExtender = new HttpExtend();

        this.mockReader = {} as IRead;
        this.mockPersis = {} as IPersistence;
        const reader = this.mockReader;
        const persis = this.mockPersis;
        this.mockAccessorManager = {
            getReader(appId: string): IRead {
                return reader;
            },
            getPersistence(appId: string): IPersistence {
                return persis;
            },
        } as AppAccessorManager;

        this.mockPreRequestHandler = {
            executePreHttpRequest(url: string, request: IHttpRequest, read: IRead, persistence: IPersistence): Promise<IHttpRequest> {
                return Promise.resolve(request);
            },
        } as IHttpPreRequestHandler;

        this.mockPreResponseHandler = {
            executePreHttpResponse(response: IHttpResponse, read: IRead, persistence: IPersistence): Promise<IHttpResponse> {
                return Promise.resolve(response);
            },
        } as IHttpPreResponseHandler;
    }

    @AsyncTest()
    public async useHttp() {
        Expect(() => new Http(this.mockAccessorManager, this.mockAppBridge, this.mockHttpExtender, this.mockAppId)).not.toThrow();

        const http = new Http(this.mockAccessorManager, this.mockAppBridge, this.mockHttpExtender, this.mockAppId);

        SpyOn(this.mockHttpBridge, 'doCall');
        SpyOn(this.mockPreRequestHandler, 'executePreHttpRequest');
        SpyOn(this.mockPreResponseHandler, 'executePreHttpResponse');

        Expect(await http.get('url-here')).toBeDefined();
        Expect(await http.post('url-here')).toBeDefined();
        Expect(await http.put('url-here')).toBeDefined();
        Expect(await http.del('url-here')).toBeDefined();
        Expect(await http.get('url-here', { headers: {}, params: {} })).toBeDefined();

        const request1 = {} as IHttpRequest;
        this.mockHttpExtender.provideDefaultHeader('Auth-Token', 'Bearer asdfasdf');
        Expect(await http.post('url-here', request1)).toBeDefined();
        Expect(request1.headers['Auth-Token']).toBe('Bearer asdfasdf');
        request1.headers['Auth-Token'] = 'mine';
        Expect(await http.put('url-here', request1)).toBeDefined(); // Check it the default doesn't override provided
        Expect(request1.headers['Auth-Token']).toBe('mine');

        const request2 = {} as IHttpRequest;
        this.mockHttpExtender.provideDefaultParam('count', '20');
        Expect(await http.del('url-here', request2)).toBeDefined();
        Expect(request2.params.count).toBe('20');
        request2.params.count = '50';
        Expect(await http.get('url-here', request2)).toBeDefined(); // Check it the default doesn't override provided
        Expect(request2.params.count).toBe('50');

        this.mockHttpExtender.providePreRequestHandler(this.mockPreRequestHandler);
        const request3 = {} as IHttpRequest;
        Expect(await http.post('url-here', request3)).toBeDefined();
        Expect(this.mockPreRequestHandler.executePreHttpRequest).toHaveBeenCalledWith('url-here', request3, this.mockReader, this.mockPersis);
        (this.mockHttpExtender as any).requests = [];

        this.mockHttpExtender.providePreResponseHandler(this.mockPreResponseHandler);
        Expect(await http.post('url-here')).toBeDefined();
        Expect(this.mockPreResponseHandler.executePreHttpResponse).toHaveBeenCalledWith(this.mockResponse, this.mockReader, this.mockPersis);

        Expect(this.mockHttpBridge.doCall).toHaveBeenCalled().exactly(11);
    }
}

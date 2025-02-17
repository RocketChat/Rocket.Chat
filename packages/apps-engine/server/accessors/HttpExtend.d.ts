import type { IHttpExtend, IHttpPreRequestHandler, IHttpPreResponseHandler } from '../../definition/accessors';
export declare class HttpExtend implements IHttpExtend {
    private headers;
    private params;
    private requests;
    private responses;
    constructor();
    provideDefaultHeader(key: string, value: string): void;
    provideDefaultHeaders(headers: {
        [key: string]: string;
    }): void;
    provideDefaultParam(key: string, value: string): void;
    provideDefaultParams(params: {
        [key: string]: string;
    }): void;
    providePreRequestHandler(handler: IHttpPreRequestHandler): void;
    providePreResponseHandler(handler: IHttpPreResponseHandler): void;
    getDefaultHeaders(): Map<string, string>;
    getDefaultParams(): Map<string, string>;
    getPreRequestHandlers(): Array<IHttpPreRequestHandler>;
    getPreResponseHandlers(): Array<IHttpPreResponseHandler>;
}

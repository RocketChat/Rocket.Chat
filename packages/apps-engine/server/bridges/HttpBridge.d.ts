import { BaseBridge } from './BaseBridge';
import type { IHttpRequest, IHttpResponse, RequestMethod } from '../../definition/accessors';
export interface IHttpBridgeRequestInfo {
    appId: string;
    method: RequestMethod;
    url: string;
    request: IHttpRequest;
}
export declare abstract class HttpBridge extends BaseBridge {
    doCall(info: IHttpBridgeRequestInfo): Promise<IHttpResponse>;
    protected abstract call(info: IHttpBridgeRequestInfo): Promise<IHttpResponse>;
    private hasDefaultPermission;
}

import type { IHttpResponse } from '../../../src/definition/accessors';
import type { IHttpBridgeRequestInfo } from '../../../src/server/bridges';
import { HttpBridge } from '../../../src/server/bridges';

export class TestsHttpBridge extends HttpBridge {
    public call(info: IHttpBridgeRequestInfo): Promise<IHttpResponse> {
        return Promise.resolve({
            url: info.url,
            method: info.method,
            statusCode: 200,
            headers: info.request.headers,
            content: info.request.content,
        });
    }
}

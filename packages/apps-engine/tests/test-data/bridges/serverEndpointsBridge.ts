import type { IServerEndpointCallInfo, IServerEndpointResponse } from '../../../src/server/bridges/ServerEndpointsBridge';
import { ServerEndpointsBridge } from '../../../src/server/bridges/ServerEndpointsBridge';

export class TestsServerEndpointsBridge extends ServerEndpointsBridge {
	public calls: Array<IServerEndpointCallInfo> = [];

	public response: IServerEndpointResponse = { statusCode: 200, headers: {} };

	protected async call<T = unknown>(info: IServerEndpointCallInfo): Promise<IServerEndpointResponse<T>> {
		this.calls.push(info);
		return this.response as IServerEndpointResponse<T>;
	}
}

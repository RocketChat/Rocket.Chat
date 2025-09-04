import type { IServerEndpoints, IServerEndpointCallOptions, IServerEndpointResponse } from '../../definition/accessors/IServerEndpoints';
import type { AppBridges } from '../bridges/AppBridges';

export class ServerEndpoints implements IServerEndpoints {
	constructor(
		private readonly bridges: AppBridges,
		private readonly appId: string,
	) {}

	public async call<T = unknown>(options: IServerEndpointCallOptions): Promise<IServerEndpointResponse<T>> {
		const { method, path, query, body, headers, userId } = options;

		const res = await this.bridges.getServerEndpointsBridge().doCall<T>({
			appId: this.appId,
			method,
			path,
			query,
			body,
			headers,
			...(userId && { user: { id: userId } }),
		});

		return res as unknown as IServerEndpointResponse<T>;
	}
}

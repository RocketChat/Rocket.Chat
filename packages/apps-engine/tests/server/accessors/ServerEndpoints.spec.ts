import { Expect, Setup, Test } from 'alsatian';

import type { IServerEndpointResponse } from '../../../src/definition/accessors/IServerEndpoints';
import { ServerEndpoints } from '../../../src/server/accessors/ServerEndpoints';
import { TestsAppBridges } from '../../test-data/bridges/appBridges';
import type { TestsServerEndpointsBridge } from '../../test-data/bridges/serverEndpointsBridge';

export class ServerEndpointsAccessorTestFixture {
	private bridges: TestsAppBridges;

	private bridge: TestsServerEndpointsBridge;

	private accessor: ServerEndpoints;

	@Setup
	public setup() {
		this.bridges = new TestsAppBridges();
		this.bridge = this.bridges.getServerEndpointsBridge();
		this.bridge.calls = [];
		this.accessor = new ServerEndpoints(this.bridges, 'testing-app');
	}

	@Test()
	public async forwardsCallOptionsToBridge() {
		const response: IServerEndpointResponse<{ ok: boolean }> = {
			statusCode: 201,
			headers: { 'content-type': 'application/json' },
			data: { ok: true },
		};
		this.bridge.response = response;

		const result = await this.accessor.call<{ ok: boolean }>({
			method: 'GET',
			path: 'users.info',
			query: { userId: '123' },
			headers: { Authorization: 'token' },
		});

		Expect(result).toBe(response);
		Expect(this.bridge.calls.length).toBe(1);

		const call = this.bridge.calls[0];
		Expect(call.appId).toBe('testing-app');
		Expect(call.method).toBe('GET');
		Expect(call.path).toBe('users.info');
		Expect(call.query).toEqual({ userId: '123' });
		Expect(call.headers).toEqual({ Authorization: 'token' });
		Expect(call.body).not.toBeDefined();
		Expect(call.user).not.toBeDefined();
	}

	@Test()
	public async includesUserContextWhenProvided() {
		const response: IServerEndpointResponse = { statusCode: 200, headers: {} };
		this.bridge.response = response;

		const result = await this.accessor.call({
			method: 'POST',
			path: 'users.create',
			body: { email: 'user@example.com' },
			userId: 'user-id',
		});

		Expect(result).toBe(response);
		Expect(this.bridge.calls.length).toBe(1);

		const call = this.bridge.calls[0];
		Expect(call.appId).toBe('testing-app');
		Expect(call.body).toEqual({ email: 'user@example.com' });
		Expect(call.user).toEqual({ id: 'user-id' });
		Expect(call.headers).not.toBeDefined();
		Expect(call.query).not.toBeDefined();
	}
}

import type { Credentials } from '@rocket.chat/api-client';
import type { Path } from '@rocket.chat/rest-typings';
import { expect } from 'chai';

import { api, request, type PathWithoutPrefix } from './api-data';
import { sleep } from '../../lib/utils/sleep';

export function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
	const controller = new AbortController();

	const timeoutId = setTimeout(() => {
		controller.abort();
	}, ms);

	return fn(controller.signal).finally(() => {
		clearTimeout(timeoutId);
	});
}

export const waitFor = <T>(read: () => Promise<T>, isDone: (value: T) => boolean, ms = 10000): Promise<T> =>
	withTimeout(async (signal) => {
		for (;;) {
			const value = await read();
			if (isDone(value) || signal.aborted) {
				return value;
			}
			await sleep(200);
		}
	}, ms);

export const pagination = <TPath extends PathWithoutPrefix<Path>>(
	apiEndpoint: TPath,
	credentials: Credentials,
	extraQueryParams: Record<string, any> = {},
) => {
	return request
		.get(api(apiEndpoint))
		.set(credentials)
		.query({
			...extraQueryParams,
			count: 10,
			offset: 1,
			sort: JSON.stringify({ _updatedAt: -1 }),
		})
		.expect('content-type', 'application/json')
		.expect(200)
		.expect((res) => {
			expect(res.body).to.have.property('count').that.is.a('number');
			expect(res.body).to.have.property('offset').that.is.a('number');
			expect(res.body).to.have.property('total').that.is.a('number');
		});
};

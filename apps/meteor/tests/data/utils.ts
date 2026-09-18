import type { Credentials } from '@rocket.chat/api-client';
import type { Path } from '@rocket.chat/rest-typings';
import { expect } from 'chai';

import { api, request, type PathWithoutPrefix } from './api-data';

export function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
	const controller = new AbortController();

	const timeoutId = setTimeout(() => {
		controller.abort();
	}, ms);

	return fn(controller.signal).finally(() => {
		clearTimeout(timeoutId);
	});
}

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

type WaitUntilOptions = {
	/** Named in the error a timeout throws, as "Timed out waiting for <description>". */
	description: string;
	timeout?: number;
	interval?: number;
};

/**
 * Reads the workspace until `read` answers with something, and returns it.
 *
 * For results nothing in the request/response cycle waits on - an app event, a history item
 * written after the response was sent - where the only way to know is to look again.
 */
export async function waitUntil<T>(
	read: () => Promise<T | undefined | null>,
	{ description, timeout = 20_000, interval = 250 }: WaitUntilOptions,
): Promise<T> {
	const deadline = Date.now() + timeout;

	for (;;) {
		const found = await read();

		if (found !== undefined && found !== null) {
			return found;
		}

		if (Date.now() >= deadline) {
			throw new Error(`Timed out waiting for ${description}`);
		}

		await new Promise((resolve) => setTimeout(resolve, interval));
	}
}

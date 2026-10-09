import { BSON } from 'mongodb';

import { PROTOCOL_PREFIX } from './protocol';
import type { HealResponse, HelloResponse, OpsResponse } from './protocol';
import type { HealRequest } from '../heal/plan';
import type { Op, SiteId } from '../types';

export type FetchLike = (
	url: string,
	init: { method: string; headers: Record<string, string>; body?: string; signal?: AbortSignal },
) => Promise<{
	status: number;
	text(): Promise<string>;
}>;

export class PeerUnavailable extends Error {}

/** Calls the peer site's replication endpoint. Any failure to get an answer is reported as `PeerUnavailable`. */
export class PeerClient {
	constructor(
		private readonly baseUrl: string,
		private readonly secret: string,
		private readonly self: SiteId,
		private readonly fetchImpl: FetchLike,
		private readonly timeoutMs: number,
	) {}

	private async call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
		const url = `${this.baseUrl.replace(/\/$/, '')}${PROTOCOL_PREFIX}${path}?from=${encodeURIComponent(this.self)}`;
		let response;
		try {
			response = await this.fetchImpl(url, {
				method,
				headers: { 'authorization': `Bearer ${this.secret}`, 'content-type': 'application/json' },
				body: body === undefined ? undefined : BSON.EJSON.stringify(body, { relaxed: false }),
				signal: AbortSignal.timeout(this.timeoutMs),
			});
		} catch (err) {
			throw new PeerUnavailable(String(err));
		}
		const text = await response.text().catch((err) => {
			throw new PeerUnavailable(String(err));
		});
		if (response.status !== 200) {
			throw new PeerUnavailable(`peer answered ${response.status}: ${text}`);
		}
		return BSON.EJSON.parse(text, { relaxed: true }) as T;
	}

	hello(): Promise<HelloResponse> {
		return this.call('GET', '/hello');
	}

	sendOps(ops: Op[]): Promise<OpsResponse> {
		return this.call('POST', '/ops', { from: this.self, ops });
	}

	heal(request: HealRequest): Promise<HealResponse> {
		return this.call('POST', '/heal', request);
	}

	async poke(): Promise<void> {
		await this.call('POST', '/heal/poke');
	}
}

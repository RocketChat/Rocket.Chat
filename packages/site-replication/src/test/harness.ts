import { createServer } from 'http';
import type { AddressInfo } from 'net';

import { MongoClient } from 'mongodb';
import type { Db, Document } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

import { SiteReplicator } from '../SiteReplicator';
import { canonical } from '../paths';
import { rocketChatPolicies, ROCKETCHAT_MESSAGES } from '../policies/rocketchat';
import type { FetchLike } from '../transport/client';
import type { AppliedChange, Logger } from '../types';

export const THRESHOLD_MS = 600;

export type Network = { up: boolean };

export type TestSite = {
	id: string;
	db: Db;
	replicator: SiteReplicator;
	notifications: AppliedChange[];
	start(): Promise<void>;
	stop(): Promise<void>;
};

const quietLogger: Logger = {
	debug: () => undefined,
	info: () => undefined,
	warn: () => undefined,
	error: (msg, extra) => console.error(msg, extra),
};

const freePort = async (): Promise<number> =>
	new Promise((resolve) => {
		const server = createServer();
		server.listen(0, '127.0.0.1', () => {
			const { port } = server.address() as AddressInfo;
			server.close(() => resolve(port));
		});
	});

export const startReplicaSets = async (): Promise<{ sets: MongoMemoryReplSet[]; clients: MongoClient[] }> => {
	const sets = await Promise.all([0, 1].map(() => MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } })));
	const clients = await Promise.all(sets.map((set) => MongoClient.connect(set.getUri())));
	return { sets, clients };
};

/** Two sites, each with its own database and replicator, joined by a network the test can cut. */
export const createSites = async (clients: MongoClient[], dbName: string, network: Network): Promise<[TestSite, TestSite]> => {
	const ports = [await freePort(), await freePort()];
	const ids = ['A', 'B'];
	const fetchThroughNetwork: FetchLike = async (url, init) => {
		if (!network.up) {
			throw new Error('network partition');
		}
		const response = await fetch(url, init);
		if (!network.up) {
			throw new Error('network partition');
		}
		return response;
	};

	return ids.map((id, index) => {
		const db = clients[index].db(dbName);
		const notifications: AppliedChange[] = [];
		const make = () =>
			new SiteReplicator({
				client: clients[index],
				db,
				site: id,
				siteName: `Site ${id}`,
				peer: { site: ids[1 - index], url: `http://127.0.0.1:${ports[1 - index]}` },
				secret: 'test-secret',
				listen: { port: ports[index], host: '127.0.0.1' },
				policies: rocketChatPolicies(),
				messagesCollection: ROCKETCHAT_MESSAGES,
				notifier: (changes) => {
					notifications.push(...changes);
				},
				partitionThresholdMs: THRESHOLD_MS,
				heartbeatMs: 50,
				requestTimeoutMs: 2_000,
				leaseTtlMs: 3_000,
				fetch: fetchThroughNetwork,
				logger: quietLogger,
			});
		const site: TestSite = {
			id,
			db,
			replicator: make(),
			notifications,
			start: () => site.replicator.start(),
			stop: async () => {
				await site.replicator.stop();
				site.replicator = make();
			},
		};
		return site;
	}) as [TestSite, TestSite];
};

export const waitFor = async (check: () => Promise<boolean> | boolean, timeoutMs = 15_000, label = 'condition'): Promise<void> => {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (await check()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	throw new Error(`timed out waiting for ${label}`);
};

const sortKeys = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value.map(sortKeys);
	}
	if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
		return Object.fromEntries(
			Object.entries(value)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([key, inner]) => [key, sortKeys(inner)]),
		);
	}
	return value;
};

/** Set fields hold the same elements on both sites, but each site appends in the order it learned them. */
const sortSetFields = (doc: Document, patterns: string[]): Document => {
	const sortAt = (value: unknown, parts: string[]): unknown => {
		if (!parts.length) {
			return Array.isArray(value) ? [...value].sort((x, y) => canonical(x).localeCompare(canonical(y))) : value;
		}
		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			return value;
		}
		const [head, ...rest] = parts;
		const keys = head === '*' ? Object.keys(value) : [head];
		const copy: Record<string, unknown> = { ...(value as Record<string, unknown>) };
		for (const key of keys) {
			if (key in copy) {
				copy[key] = sortAt(copy[key], rest);
			}
		}
		return copy;
	};
	return patterns.reduce((acc, pattern) => sortAt(acc, pattern.split('.')) as Document, doc);
};

const POLICIES = rocketChatPolicies();

export const snapshot = async (db: Db, collections: string[]): Promise<string> => {
	const dump: Record<string, Document[]> = {};
	for (const name of collections) {
		const sets = POLICIES.find((policy) => policy.name === name)?.sets ?? [];
		dump[name] = (await db.collection(name).find({}).sort({ _id: 1 }).toArray()).map((doc) => sortSetFields(doc, sets));
	}
	return canonical(sortKeys(dump));
};

export const REPLICATED = POLICIES.map((policy) => policy.name);

/** Resolves once both sites hold the same data and have shipped everything they captured. */
export const converged = async (a: TestSite, b: TestSite, timeoutMs = 15_000): Promise<void> => {
	let last: [string, string] = ['', ''];
	try {
		await waitFor(
			async () => {
				last = [await snapshot(a.db, REPLICATED), await snapshot(b.db, REPLICATED)];
				const pending = await Promise.all([a, b].map((site) => site.db.collection('rocketchat_site_replication_outbox').countDocuments()));
				return last[0] === last[1] && pending.every((count) => count === 0);
			},
			timeoutMs,
			'sites to converge',
		);
	} catch (err) {
		throw new Error(`${String(err)}\nA: ${last[0]}\nB: ${last[1]}`, { cause: err });
	}
};

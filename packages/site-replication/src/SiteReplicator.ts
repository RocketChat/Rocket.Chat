import type { Server } from 'http';
import type { AddressInfo } from 'net';

import type { Db, MongoClient } from 'mongodb';

import { Lease } from './Lease';
import { Applier } from './apply/Applier';
import { Capture } from './capture/Capture';
import { sleep } from './context';
import type { Context } from './context';
import { HealCoordinator } from './heal/HealCoordinator';
import { Link } from './link/Link';
import { ensureStoreIndexes, openStore } from './store';
import { PeerClient } from './transport/client';
import type { FetchLike } from './transport/client';
import type { PeerHandlers } from './transport/protocol';
import { createPeerServer } from './transport/server';
import type { CollectionPolicy, Logger, Notifier, SiteId } from './types';

export type SiteReplicatorOptions = {
	client: MongoClient;
	db: Db;
	site: SiteId;
	siteName?: string;
	peer: { site: SiteId; url: string };
	secret: string;
	/** Where the peer reaches this site. Port 0 picks a free port. */
	listen: { port: number; host?: string };
	policies: CollectionPolicy[];
	/** The messages collection, whose writes while disconnected are folded into threads on reconnection. */
	messagesCollection: string;
	notifier?: Notifier;
	/** An outage at least this long counts as a partition and gets its messages threaded. */
	partitionThresholdMs?: number;
	heartbeatMs?: number;
	batchSize?: number;
	requestTimeoutMs?: number;
	/** How long per-field write history is kept. Must exceed the longest partition the sites should survive. */
	versionRetentionDays?: number;
	leaseTtlMs?: number;
	fetch?: FetchLike;
	logger?: Logger;
};

const consoleLogger: Logger = {
	debug: () => undefined,
	info: (msg, extra) => console.log(`[site-replication] ${msg}`, extra ?? ''),
	warn: (msg, extra) => console.warn(`[site-replication] ${msg}`, extra ?? ''),
	error: (msg, extra) => console.error(`[site-replication] ${msg}`, extra ?? ''),
};

type Running = { capture: Capture; applier: Applier; link: Link; coordinator: HealCoordinator };

/**
 * Keeps this site's database converging with one peer site's while both accept writes, including
 * while they cannot reach each other. Every server instance of a site may run one; a lease picks the
 * instance that does the work.
 */
export class SiteReplicator {
	private readonly ctx: Context;

	private readonly lease: Lease;

	private server: Server | undefined;

	private running: Running | undefined;

	private stopped = true;

	private leaseLoop: Promise<void> | undefined;

	constructor(private readonly options: SiteReplicatorOptions) {
		if (options.site === options.peer.site) {
			throw new Error('site and peer site must differ');
		}
		const store = openStore(options.db);
		this.ctx = {
			client: options.client,
			db: options.db,
			store,
			site: options.site,
			siteName: options.siteName ?? options.site,
			peer: options.peer.site,
			policies: new Map(options.policies.map((policy) => [policy.name, policy])),
			messagesCollection: options.messagesCollection,
			logger: options.logger ?? consoleLogger,
			ownSessions: new Set(),
		};
		this.lease = new Lease(store, options.leaseTtlMs ?? 15_000);
	}

	get port(): number | undefined {
		return (this.server?.address() as AddressInfo | null)?.port;
	}

	isLeader(): boolean {
		return !!this.running;
	}

	async start(): Promise<void> {
		await this.prepareDatabase();
		this.server = createPeerServer({
			secret: this.options.secret,
			peer: this.options.peer.site,
			handlers: () => this.handlers(),
			logger: this.ctx.logger,
		});
		await new Promise<void>((resolve) => this.server?.listen(this.options.listen.port, this.options.listen.host, resolve));
		this.stopped = false;
		await this.holdLease();
		this.leaseLoop = this.renewLease();
	}

	async stop(): Promise<void> {
		this.stopped = true;
		await this.leaseLoop;
		await this.stepDown();
		await this.lease.release().catch(() => undefined);
		await new Promise<void>((resolve) => (this.server ? this.server.close(() => resolve()) : resolve()));
		this.server?.closeAllConnections();
	}

	private handlers(): PeerHandlers | undefined {
		const { running } = this;
		if (!running) {
			return undefined;
		}
		return {
			hello: async () => ({ site: this.ctx.site, name: this.ctx.siteName, applied: await running.applier.appliedFrom(this.ctx.peer) }),
			ops: (request) => running.link.receive(request.ops),
			heal: (request) => running.coordinator.handleHeal(request),
			poke: () => running.coordinator.handlePoke(),
		};
	}

	/** Change stream pre- and post-images let a captured change carry exact counter deltas and set differences. */
	private async prepareDatabase(): Promise<void> {
		const { db } = this.ctx;
		const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map(({ name }) => name));
		for (const name of this.ctx.policies.keys()) {
			if (existing.has(name)) {
				await db.command({ collMod: name, changeStreamPreAndPostImages: { enabled: true } });
			} else {
				await db.createCollection(name, { changeStreamPreAndPostImages: { enabled: true } });
			}
		}
		await ensureStoreIndexes(this.ctx.store, (this.options.versionRetentionDays ?? 30) * 86_400);
	}

	private async renewLease(): Promise<void> {
		const interval = (this.options.leaseTtlMs ?? 15_000) / 3;
		while (!this.stopped) {
			await sleep(interval);
			if (!this.stopped) {
				await this.holdLease().catch((err) => this.ctx.logger.error('lease renewal failed', { err: String(err) }));
			}
		}
	}

	private async holdLease(): Promise<void> {
		const leader = await this.lease.acquire();
		if (leader && !this.running) {
			await this.stepUp();
		} else if (!leader && this.running) {
			await this.stepDown();
		}
	}

	private async stepUp(): Promise<void> {
		const { options, ctx } = this;
		const peerClient = new PeerClient(
			options.peer.url,
			options.secret,
			ctx.site,
			options.fetch ?? globalThis.fetch,
			options.requestTimeoutMs ?? 10_000,
		);
		let link: Link | undefined;
		const capture = new Capture(ctx, () => link?.wake());
		const applier = new Applier(ctx, capture, options.notifier ?? (() => undefined));
		const coordinator = new HealCoordinator(ctx, peerClient, applier, options.partitionThresholdMs ?? 30_000, () => link?.wake());
		link = new Link(ctx, peerClient, applier, coordinator, {
			heartbeatMs: options.heartbeatMs ?? 2_000,
			thresholdMs: options.partitionThresholdMs ?? 30_000,
			batchSize: options.batchSize ?? 200,
		});
		await applier.init();
		await coordinator.load();
		capture.start();
		await link.start();
		this.running = { capture, applier, link, coordinator };
		ctx.logger.info('replicating with peer site', { site: ctx.site, peer: ctx.peer });
	}

	private async stepDown(): Promise<void> {
		const { running } = this;
		this.running = undefined;
		if (!running) {
			return;
		}
		await running.link.stop();
		await running.capture.stop();
		await running.applier.close();
	}
}

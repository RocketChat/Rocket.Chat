import type { Applier } from '../apply/Applier';
import type { Context } from '../context';
import type { HealCoordinator } from '../heal/HealCoordinator';
import type { LinkState, OutboxEntry, PeerState } from '../store';
import type { PeerClient } from '../transport/client';
import type { Op } from '../types';

export type LinkOptions = {
	heartbeatMs: number;
	thresholdMs: number;
	batchSize: number;
};

const MAX_BACKOFF_MS = 5_000;

const toOp = ({ _id, ...op }: OutboxEntry): Op => op;

/**
 * Ships the outbox to the peer in order and keeps track of whether the peer is reachable.
 * An outage longer than the partition threshold hands over to the heal coordinator before anything else ships.
 */
export class Link {
	private stopped = true;

	private running: Promise<void> | undefined;

	private wakeUp: (() => void) | undefined;

	private downSince: number | null = null;

	private lastContact = 0;

	private failures = 0;

	constructor(
		private readonly ctx: Context,
		private readonly peer: PeerClient,
		private readonly applier: Applier,
		private readonly coordinator: HealCoordinator,
		private readonly options: LinkOptions,
	) {}

	async start(): Promise<void> {
		const link = (await this.ctx.store.state.findOne({ _id: 'link' })) as LinkState | null;
		this.downSince = link?.downSince ?? null;
		this.stopped = false;
		this.running = this.loop();
	}

	async stop(): Promise<void> {
		this.stopped = true;
		this.wake();
		await this.running;
	}

	wake(): void {
		this.wakeUp?.();
	}

	isUp(): boolean {
		return this.downSince === null && !this.coordinator.isHealing();
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => {
			const timer = setTimeout(done, ms);
			function done() {
				clearTimeout(timer);
				resolve();
			}
			this.wakeUp = done;
		});
	}

	private async loop(): Promise<void> {
		while (!this.stopped) {
			try {
				const progressed = await this.tick();
				this.failures = 0;
				if (!progressed) {
					await this.sleep(this.options.heartbeatMs);
				}
			} catch (err) {
				this.failures++;
				await this.markDown(err);
				await this.sleep(Math.min(MAX_BACKOFF_MS, 250 * 2 ** Math.min(this.failures, 5)));
			}
		}
	}

	private async tick(): Promise<boolean> {
		if (this.downSince !== null) {
			await this.peer.hello();
			await this.markUp();
			return true;
		}
		if (this.coordinator.isHealing()) {
			await this.coordinator.continueHealing();
			return false;
		}
		const { store, peer } = this.ctx;
		const state = (await store.state.findOne({ _id: `peer:${peer}` })) as PeerState | null;
		const acked = state?.acked ?? 0;
		const entries = await store.outbox
			.find({ _id: { $gt: acked } })
			.sort({ _id: 1 })
			.limit(this.options.batchSize)
			.toArray();
		if (!entries.length) {
			if (Date.now() - this.lastContact >= this.options.heartbeatMs) {
				await this.peer.hello();
				this.lastContact = Date.now();
			}
			return false;
		}
		const response = await this.peer.sendOps(entries.map(toOp));
		this.lastContact = Date.now();
		if ('busy' in response) {
			return false;
		}
		await store.state.updateOne(
			{ _id: `peer:${peer}` },
			{ $max: { acked: response.applied }, $setOnInsert: { applied: 0 } },
			{
				upsert: true,
			},
		);
		await store.outbox.deleteMany({ _id: { $lte: response.applied } });
		return response.applied > acked;
	}

	private async markDown(err: unknown): Promise<void> {
		if (this.downSince !== null) {
			return;
		}
		this.downSince = this.lastContact || Date.now();
		this.ctx.logger.warn('peer site unreachable', { since: new Date(this.downSince).toISOString(), err: String(err) });
		await this.ctx.store.state.updateOne({ _id: 'link' }, { $set: { downSince: this.downSince } }, { upsert: true });
	}

	private async markUp(): Promise<void> {
		const outageStart = this.downSince;
		this.downSince = null;
		this.lastContact = Date.now();
		if (outageStart === null) {
			return;
		}
		const outage = this.lastContact - outageStart;
		this.ctx.logger.info('peer site reachable again', { outageMs: outage });
		if (outage >= this.options.thresholdMs) {
			await this.coordinator.begin(outageStart);
		} else {
			await this.ctx.store.state.updateOne({ _id: 'link' }, { $set: { downSince: null } }, { upsert: true });
		}
	}

	/** Applies a batch the peer shipped here, or reports busy while a merge plan is being agreed. */
	async receive(ops: Op[]): Promise<{ applied: number } | { busy: true }> {
		const applied = await this.coordinator.whileAccepting(() => this.applier.applyBatch(this.ctx.peer, ops));
		return applied === undefined ? { busy: true } : { applied };
	}
}

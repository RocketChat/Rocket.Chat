import { randomUUID } from 'crypto';

import { buildPlan, isThreadable, sideOf } from './plan';
import type { HealPlan, HealRequest, HealSide } from './plan';
import type { Applier } from '../apply/Applier';
import type { Context } from '../context';
import type { LinkState } from '../store';
import type { PeerClient } from '../transport/client';
import type { HealResponse } from '../transport/protocol';

const POKE_INTERVAL_MS = 2_000;

/**
 * Brings the two sites to one merge plan after they reconnect. The site with the smaller id asks;
 * the other answers. Until both hold the plan, neither ships nor takes operations written while disconnected.
 */
export class HealCoordinator {
	private healing = false;

	private outageStart: number | null = null;

	private acceptingFromPeer = true;

	private applying = 0;

	private lastPoke = 0;

	constructor(
		private readonly ctx: Context,
		private readonly peer: PeerClient,
		private readonly applier: Applier,
		private readonly thresholdMs: number,
		private readonly wakeLink: () => void,
	) {}

	async load(): Promise<void> {
		const link = (await this.ctx.store.state.findOne({ _id: 'link' })) as LinkState | null;
		this.healing = !!link?.healing;
		this.outageStart = link?.downSince ?? null;
	}

	isHealing(): boolean {
		return this.healing;
	}

	private get initiates(): boolean {
		return this.ctx.site < this.ctx.peer;
	}

	/** Called when the peer answers again after an outage that started at `outageStart`. */
	async begin(outageStart: number | null): Promise<void> {
		const starts = [this.healing ? this.outageStart : null, outageStart].filter((start): start is number => start !== null);
		this.healing = true;
		this.outageStart = starts.length ? Math.min(...starts) : null;
		await this.ctx.store.state.updateOne({ _id: 'link' }, { $set: { healing: true, downSince: this.outageStart } }, { upsert: true });
		this.wakeLink();
	}

	/** One step of reaching a plan, run by the link loop while healing. */
	async continueHealing(): Promise<void> {
		if (!this.healing) {
			return;
		}
		if (this.initiates) {
			await this.initiate();
			return;
		}
		if (Date.now() - this.lastPoke >= POKE_INTERVAL_MS) {
			this.lastPoke = Date.now();
			await this.peer.poke();
		}
	}

	/** Runs the application of a batch of peer operations, unless a handshake has frozen what this site has applied. */
	async whileAccepting<T>(apply: () => Promise<T>): Promise<T | undefined> {
		if (!this.acceptingFromPeer) {
			return undefined;
		}
		this.applying++;
		try {
			return await apply();
		} finally {
			this.applying--;
		}
	}

	private async quiesceApplies(): Promise<void> {
		while (this.applying > 0) {
			await new Promise((resolve) => setTimeout(resolve, 20));
		}
	}

	private async backlogSide(from: number): Promise<HealSide> {
		const { store, site, siteName, messagesCollection } = this.ctx;
		const last = await store.outbox
			.find({}, { projection: { _id: 1 } })
			.sort({ _id: -1 })
			.limit(1)
			.next();
		const cut = Math.max(last?._id ?? 0, from);
		const inserts = await store.outbox
			.find({ _id: { $gt: from, $lte: cut }, coll: messagesCollection, kind: 'insert' }, { projection: { doc: 1 } })
			.toArray();
		const rooms = [
			...new Set(inserts.filter((entry) => entry.doc && isThreadable(entry.doc)).map((entry) => String(entry.doc?.rid))),
		].sort();
		return { site, name: siteName, downSince: this.outageStart, from, cut, rooms };
	}

	private async initiate(): Promise<void> {
		this.acceptingFromPeer = false;
		try {
			await this.quiesceApplies();
			const hello = await this.peer.hello();
			const request: HealRequest = {
				healId: randomUUID(),
				at: Date.now(),
				thresholdMs: this.thresholdMs,
				initiator: await this.backlogSide(hello.applied),
				responderFrom: await this.applier.appliedFrom(this.ctx.peer),
			};
			const { responder } = await this.peer.heal(request);
			await this.activate(buildPlan(request, responder));
		} finally {
			this.acceptingFromPeer = true;
		}
	}

	/** The responder's half of the handshake. Repeating a request returns the plan already agreed for it. */
	async handleHeal(request: HealRequest): Promise<HealResponse> {
		const existing = await this.ctx.store.heals.findOne({ _id: request.healId });
		const existingSide = existing && sideOf(existing, this.ctx.site);
		if (existingSide) {
			return { responder: existingSide };
		}
		this.healing = true;
		const responder = await this.backlogSide(request.responderFrom);
		await this.activate(buildPlan(request, responder));
		return { responder };
	}

	async handlePoke(): Promise<void> {
		if (this.initiates && !this.healing) {
			await this.begin(null);
		}
	}

	private async activate(plan: HealPlan): Promise<void> {
		const { store, logger } = this.ctx;
		await store.heals.updateOne({ _id: plan._id }, { $setOnInsert: plan }, { upsert: true });
		this.applier.addPlan(plan);
		await this.applier.rethreadOwnBacklog(plan);
		this.healing = false;
		this.outageStart = null;
		await store.state.updateOne({ _id: 'link' }, { $set: { healing: false, downSince: null } }, { upsert: true });
		logger.info('sites reconciled after reconnecting', { heal: plan._id, threadedRooms: plan.rooms.length });
		this.wakeLink();
	}
}

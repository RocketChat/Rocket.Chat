import { randomUUID } from 'crypto';

import type { ChangeStream, ChangeStreamDocument, ChangeStreamOptions, Document, ResumeToken } from 'mongodb';

import { buildOp } from './buildOp';
import type { CapturedEvent, UnsequencedOp } from './buildOp';
import { sessionKey, sleep } from '../context';
import type { Context } from '../context';
import type { CaptureState, OutboxEntry } from '../store';
import type { Stamp } from '../types';
import { emptyVersion, newestAmong, stampPaths, versionKey } from '../versions';
import type { VersionDoc } from '../versions';

const BATCH_LIMIT = 500;
const FENCE_TIMEOUT_MS = 30_000;

type Captured = { op: UnsequencedOp; updatedAt: Date | null | undefined };

const writtenPaths = (op: UnsequencedOp): string[] => [...(op.set ?? []).map(([path]) => path), ...(op.unset ?? [])];

const toCapturedEvent = (event: ChangeStreamDocument<Document>): CapturedEvent | undefined => {
	if (!('documentKey' in event) || typeof event.documentKey._id !== 'string') {
		return undefined;
	}
	if (
		event.operationType !== 'insert' &&
		event.operationType !== 'update' &&
		event.operationType !== 'replace' &&
		event.operationType !== 'delete'
	) {
		return undefined;
	}
	const { clusterTime } = event;
	return {
		operationType: event.operationType,
		id: event.documentKey._id,
		t: (event as { wallTime?: Date }).wallTime?.getTime() ?? (clusterTime ? clusterTime.high * 1000 : Date.now()),
		fullDocument: 'fullDocument' in event ? event.fullDocument : undefined,
		fullDocumentBeforeChange: 'fullDocumentBeforeChange' in event ? event.fullDocumentBeforeChange : undefined,
		updateDescription: 'updateDescription' in event ? event.updateDescription : undefined,
	};
};

/**
 * Records every local write to a replicated collection as an operation in the outbox, in commit order,
 * exactly once across restarts. Writes the replicator itself made while applying the peer's operations are skipped.
 */
export class Capture {
	private stream: ChangeStream<Document> | undefined;

	private stopped = false;

	private running: Promise<void> | undefined;

	private readonly fenceWaiters = new Map<string, () => void>();

	constructor(
		private readonly ctx: Context,
		private readonly onCaptured: () => void,
	) {}

	start(): void {
		this.stopped = false;
		this.running = this.run();
	}

	async stop(): Promise<void> {
		this.stopped = true;
		await this.stream?.close().catch(() => undefined);
		await this.running;
	}

	/** Resolves once every local write committed before the call is in the outbox and the version table. */
	async fence(): Promise<void> {
		const id = randomUUID();
		const seen = new Promise<void>((resolve, reject) => {
			const timer = setTimeout(() => {
				this.fenceWaiters.delete(id);
				reject(new Error('capture did not reach the fence in time'));
			}, FENCE_TIMEOUT_MS);
			this.fenceWaiters.set(id, () => {
				clearTimeout(timer);
				resolve();
			});
		});
		await this.ctx.store.fence.insertOne({ _id: id, at: new Date() });
		return seen;
	}

	private async run(): Promise<void> {
		while (!this.stopped) {
			try {
				await this.consume();
			} catch (err) {
				if (this.stopped) {
					return;
				}
				this.ctx.logger.error('capture failed, restarting', { err: String(err) });
				await sleep(1000);
			}
		}
	}

	private async openStream(): Promise<ChangeStream<Document>> {
		const { db, store, policies } = this.ctx;
		const state = (await store.state.findOne({ _id: 'capture' })) as CaptureState | null;
		const options: ChangeStreamOptions = {
			fullDocument: 'whenAvailable',
			fullDocumentBeforeChange: 'whenAvailable',
			maxAwaitTimeMS: 200,
		};
		if (state?.token) {
			options.resumeAfter = state.token;
		} else {
			const hello = await db.command({ hello: 1 });
			options.startAtOperationTime = hello.operationTime;
		}
		const names = [...policies.keys(), store.fence.collectionName];
		return db.watch([{ $match: { 'ns.coll': { $in: names } } }], options);
	}

	private async consume(): Promise<void> {
		this.stream = await this.openStream();
		const { stream } = this;
		try {
			while (!this.stopped) {
				const first = await stream.tryNext();
				if (!first) {
					continue;
				}
				const batch = [first];
				while (batch.length < BATCH_LIMIT) {
					const next = await stream.tryNext();
					if (!next) {
						break;
					}
					batch.push(next);
				}
				await this.persist(batch, batch[batch.length - 1]._id);
			}
		} finally {
			await stream.close().catch(() => undefined);
		}
	}

	private async persist(batch: ChangeStreamDocument<Document>[], token: ResumeToken): Promise<void> {
		const { store, policies, site, ownSessions } = this.ctx;
		const captured: Captured[] = [];
		const fences: string[] = [];

		for (const event of batch) {
			if (!('ns' in event) || !event.ns || !('coll' in event.ns)) {
				continue;
			}
			if (event.ns.coll === store.fence.collectionName) {
				if (event.operationType === 'insert') {
					fences.push(String(event.documentKey._id));
				}
				continue;
			}
			const lsid = sessionKey((event as { lsid?: { id: never } }).lsid);
			if (lsid && ownSessions.has(lsid)) {
				continue;
			}
			const policy = policies.get(event.ns.coll);
			const capturedEvent = toCapturedEvent(event);
			if (!policy || !capturedEvent) {
				continue;
			}
			const op = buildOp(policy, site, capturedEvent);
			if (op) {
				captured.push({ op, updatedAt: capturedEvent.fullDocument?._updatedAt });
			}
		}

		if (captured.length) {
			await this.write(captured, token);
		} else {
			await store.state.updateOne({ _id: 'capture' }, { $set: { token } }, { upsert: true });
		}

		for (const id of fences) {
			this.fenceWaiters.get(id)?.();
			this.fenceWaiters.delete(id);
		}
		if (captured.length) {
			this.onCaptured();
		}
	}

	private async write(captured: Captured[], token: ResumeToken): Promise<void> {
		const { client, store } = this.ctx;
		const session = client.startSession();
		try {
			await session.withTransaction(async () => {
				const state = (await store.state.findOneAndUpdate(
					{ _id: 'capture' },
					{ $inc: { seq: captured.length }, $set: { token } },
					{ upsert: true, returnDocument: 'after', session },
				)) as CaptureState | null;
				const firstSeq = (state?.seq ?? captured.length) - captured.length + 1;

				const keys = [...new Set(captured.map(({ op }) => versionKey(op.coll, op.id)))];
				const versions = new Map<string, VersionDoc>(
					(await store.versions.find({ _id: { $in: keys } }, { session }).toArray()).map((doc) => [doc._id, doc]),
				);

				const entries: OutboxEntry[] = captured.map(({ op, updatedAt }, index) => {
					const key = versionKey(op.coll, op.id);
					const version = versions.get(key) ?? emptyVersion(op.coll, op.id);
					const stamped = this.stamp(op, version);
					versions.set(key, this.recordLocalWrite(stamped, version, updatedAt));
					return { ...stamped, seq: firstSeq + index, _id: firstSeq + index };
				});

				await store.outbox.insertMany(entries, { session });
				await store.versions.bulkWrite(
					[...versions.values()].map((doc) => ({ replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true } })),
					{ session },
				);
			});
		} finally {
			await session.endSession();
		}
	}

	/** Stamps a local write after every write it overwrites, so a slow local clock cannot make it lose to older peer writes. */
	private stamp(op: UnsequencedOp, version: VersionDoc): UnsequencedOp {
		const overwritten = newestAmong(version, writtenPaths(op));
		return overwritten && overwritten.t >= op.t ? { ...op, t: overwritten.t + 1 } : op;
	}

	private recordLocalWrite(op: UnsequencedOp, version: VersionDoc, updatedAt: Date | null | undefined): VersionDoc {
		const stamp: Stamp = { t: op.t, s: op.site };
		const next: VersionDoc = { ...version, at: new Date(), ua: updatedAt ?? null };
		switch (op.kind) {
			case 'insert':
				next.ins = stamp;
				delete next.del;
				next.v = stampPaths(
					next.v,
					Object.keys(op.doc ?? {}).filter((key) => key !== '_id'),
					stamp,
				);
				return next;
			case 'update':
				next.v = stampPaths(next.v, writtenPaths(op), stamp);
				return next;
			case 'delete':
				next.del = stamp;
				next.ua = null;
				return next;
		}
	}
}

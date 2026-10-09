import { randomUUID } from 'crypto';

import { MongoServerError } from 'mongodb';
import type { ClientSession, Collection, Document, Filter, UpdateFilter } from 'mongodb';

import { foldUpdate, fieldStamp, mergeDocuments } from './merge';
import type { Capture } from '../capture/Capture';
import { sessionKey } from '../context';
import type { Context } from '../context';
import { anchorMessage, isInBacklog, isThreadable, sideOf } from '../heal/plan';
import type { HealPlan } from '../heal/plan';
import { getAt, sameValue } from '../paths';
import type { PeerState, SessionsState } from '../store';
import type { AppliedChange, CollectionPolicy, Notifier, Op, PathValue, Stamp, UniqueKey } from '../types';
import { compareStamps, emptyVersion, isNewer, stampPaths, versionKey } from '../versions';
import type { VersionDoc } from '../versions';

/** A replicated document. Rocket.Chat keys every replicated collection by string ids. */
type Doc = Document & { _id: string };

const MAX_FENCE_RETRIES = 5;
const KEPT_SESSIONS = 50;

/** A local write the capture has not recorded yet touched the document; applying now could undo it. */
class UncapturedLocalWrite extends Error {}

type ApplyResult = { changes: AppliedChange[] };

type Prepared = { op: Op; extraStamp?: { paths: string[]; stamp: Stamp }; changes: AppliedChange[] };

const isTransient = (err: unknown): boolean =>
	err instanceof MongoServerError &&
	(err.hasErrorLabel('TransientTransactionError') || err.hasErrorLabel('UnknownTransactionCommitResult'));

const sameDate = (a: unknown, b: unknown): boolean =>
	a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : a === b || (a == null && b == null);

const suffixed = (value: unknown, site: string): unknown => (typeof value === 'string' ? `${value}-${site}` : value);

/**
 * Applies the peer's operations so that both sites end in the same state whatever order their writes
 * crossed in, and reports what changed so the host can publish it.
 */
export class Applier {
	private session: ClientSession | undefined;

	private plans: HealPlan[] = [];

	constructor(
		private readonly ctx: Context,
		private readonly capture: Capture,
		private readonly notifier: Notifier,
	) {}

	async init(): Promise<void> {
		const { client, store, ownSessions } = this.ctx;
		const known = (await store.state.findOne({ _id: 'sessions' })) as SessionsState | null;
		for (const id of known?.ids ?? []) {
			ownSessions.add(id);
		}
		this.session = client.startSession();
		const key = sessionKey(this.session.id);
		if (!key) {
			throw new Error('could not allocate a server session for the replicator');
		}
		ownSessions.add(key);
		await store.state.updateOne(
			{ _id: 'sessions' },
			{ $push: { ids: { $each: [key], $slice: -KEPT_SESSIONS } } },
			{
				upsert: true,
			},
		);
		this.plans = await store.heals.find({}).sort({ at: -1 }).limit(10).toArray();
	}

	async close(): Promise<void> {
		await this.session?.endSession();
	}

	addPlan(plan: HealPlan): void {
		this.plans = [plan, ...this.plans.filter((existing) => existing._id !== plan._id)].slice(0, 10);
	}

	async appliedFrom(peer: string): Promise<number> {
		const state = (await this.ctx.store.state.findOne({ _id: `peer:${peer}` })) as PeerState | null;
		return state?.applied ?? 0;
	}

	/** Applies operations in order, skipping any already applied, and returns the last sequence number applied. */
	async applyBatch(peer: string, ops: Op[]): Promise<number> {
		await this.capture.fence();
		const changes: AppliedChange[] = [];
		for (const op of ops) {
			for (let attempt = 0; ; attempt++) {
				try {
					changes.push(...(await this.applyOne(peer, op)).changes);
					break;
				} catch (err) {
					if (err instanceof UncapturedLocalWrite && attempt < MAX_FENCE_RETRIES) {
						await this.capture.fence();
						continue;
					}
					if (err instanceof MongoServerError && !isTransient(err)) {
						await this.setAside(peer, op, err.message);
						break;
					}
					throw err;
				}
			}
		}
		await this.publish(changes);
		return this.appliedFrom(peer);
	}

	/** Moves this site's own messages written while disconnected into their thread, as the plan says. */
	async rethreadOwnBacklog(plan: HealPlan): Promise<void> {
		const { store, site, messagesCollection, db } = this.ctx;
		const side = sideOf(plan, site);
		const changes: AppliedChange[] = [];
		if (side && plan.rooms.length) {
			const entries = await store.outbox
				.find({ '_id': { $gt: side.from, $lte: side.cut }, 'coll': messagesCollection, 'kind': 'insert', 'doc.rid': { $in: plan.rooms } })
				.sort({ _id: 1 })
				.toArray();
			const byRoom = new Map<string, Document[]>();
			for (const entry of entries) {
				if (entry.doc && isThreadable(entry.doc)) {
					byRoom.set(entry.doc.rid, [...(byRoom.get(entry.doc.rid) ?? []), entry.doc]);
				}
			}
			const messages = db.collection<Doc>(messagesCollection);
			const stamp: Stamp = { t: plan.at, s: site };
			await this.inTransaction(async (session) => {
				changes.length = 0;
				for (const [rid, docs] of byRoom) {
					const anchor = anchorMessage(plan, site, rid, docs[0].ts);
					const exists = await messages.findOne({ _id: anchor._id }, { session, projection: { _id: 1 } });
					if (!exists) {
						await messages.insertOne(anchor as Doc, { session });
					}
					await messages.updateOne(
						{ _id: anchor._id },
						{
							$set: {
								tcount: docs.length,
								replies: [...new Set(docs.map((doc) => (doc.u as { _id?: string } | undefined)?._id).filter(Boolean))],
								tlm: new Date(Math.max(...docs.map((doc) => new Date(doc.ts).getTime()))),
							},
						},
						{ session },
					);
					changes.push({ coll: messagesCollection, id: anchor._id, action: exists ? 'updated' : 'inserted' });
					for (const doc of docs) {
						const updated = await messages.updateOne(
							{ _id: doc._id },
							{ $set: { tmid: anchor._id, _updatedAt: new Date(plan.at) } },
							{ session },
						);
						if (updated.matchedCount) {
							await this.stampVersion(messagesCollection, doc._id, ['tmid', '_updatedAt'], stamp, new Date(plan.at), session);
							changes.push({ coll: messagesCollection, id: doc._id, action: 'updated' });
						}
					}
				}
				await store.heals.updateOne({ _id: plan._id }, { $set: { localRethreadDone: true } }, { session });
			});
		} else {
			await store.heals.updateOne({ _id: plan._id }, { $set: { localRethreadDone: true } });
		}
		this.addPlan({ ...plan, localRethreadDone: true });
		await this.publish(changes);
	}

	private async inTransaction(work: (session: ClientSession) => Promise<void>): Promise<void> {
		if (!this.session) {
			throw new Error('applier is not initialized');
		}
		const { session } = this;
		await session.withTransaction(() => work(session));
	}

	private async applyOne(peer: string, op: Op): Promise<ApplyResult> {
		let changes: AppliedChange[] = [];
		await this.inTransaction(async (session) => {
			changes = [];
			const state = (await this.ctx.store.state.findOne({ _id: `peer:${peer}` }, { session })) as PeerState | null;
			if (state && op.seq <= state.applied) {
				return;
			}
			const policy = this.ctx.policies.get(op.coll);
			if (policy) {
				changes = await this.applyOp(policy, op, session);
			}
			await this.ctx.store.state.updateOne(
				{ _id: `peer:${peer}` },
				{ $set: { applied: op.seq }, $setOnInsert: { acked: 0 } },
				{ upsert: true, session },
			);
		});
		return { changes };
	}

	private async setAside(peer: string, op: Op, reason: string): Promise<void> {
		this.ctx.logger.warn('operation could not be applied and was set aside', { coll: op.coll, id: op.id, seq: op.seq, reason });
		await this.inTransaction(async (session) => {
			await this.ctx.store.conflicts.insertOne({ _id: randomUUID(), at: new Date(), coll: op.coll, reason, op }, { session });
			await this.ctx.store.state.updateOne(
				{ _id: `peer:${peer}` },
				{ $max: { applied: op.seq }, $setOnInsert: { acked: 0 } },
				{ upsert: true, session },
			);
		});
	}

	private async applyOp(policy: CollectionPolicy, original: Op, session: ClientSession): Promise<AppliedChange[]> {
		const id = await this.resolveAlias(original.coll, original.id, session);
		const prepared = await this.prepareForHeal({ ...original, id }, session);
		const { op } = prepared;
		const coll = this.ctx.db.collection<Doc>(op.coll);
		const version = await this.ctx.store.versions.findOne({ _id: versionKey(op.coll, id) }, { session });
		const stamp: Stamp = { t: op.t, s: op.site };

		let changes: AppliedChange[];
		switch (op.kind) {
			case 'insert':
				changes = await this.applyInsert(policy, coll, op, version, stamp, session);
				break;
			case 'update':
				changes = await this.applyUpdate(policy, coll, op, version, stamp, session);
				break;
			case 'delete':
				changes = await this.applyDelete(coll, op, version, stamp, session);
				break;
		}
		if (prepared.extraStamp && changes.length) {
			const { paths, stamp: extra } = prepared.extraStamp;
			await this.stampVersion(op.coll, id, paths, extra, new Date(extra.t), session);
		}
		return [...prepared.changes, ...changes];
	}

	private async resolveAlias(coll: string, id: string, session: ClientSession): Promise<string> {
		const alias = await this.ctx.store.aliases.findOne({ _id: versionKey(coll, id) }, { session });
		return alias?.winner ?? id;
	}

	/** Rewrites a peer message written while disconnected into its thread, creating the thread's first message if needed. */
	private async prepareForHeal(op: Op, session: ClientSession): Promise<Prepared> {
		const { messagesCollection, db } = this.ctx;
		if (op.coll !== messagesCollection || op.kind !== 'insert' || !op.doc || !isThreadable(op.doc)) {
			return { op, changes: [] };
		}
		const { doc } = op;
		const plan = this.plans.find((candidate) => candidate.rooms.includes(doc.rid) && isInBacklog(candidate, op.site, op.seq));
		if (!plan) {
			return { op, changes: [] };
		}
		const messages = db.collection<Doc>(messagesCollection);
		const anchor = anchorMessage(plan, op.site, doc.rid, doc.ts);
		const exists = await messages.findOne({ _id: anchor._id }, { session, projection: { _id: 1 } });
		if (!exists) {
			await messages.insertOne(anchor as Doc, { session });
		}
		await messages.updateOne(
			{ _id: anchor._id },
			{ $inc: { tcount: 1 }, $addToSet: { replies: doc.u?._id }, $max: { tlm: doc.ts } },
			{ session },
		);
		return {
			op: { ...op, doc: { ...doc, tmid: anchor._id, _updatedAt: new Date(plan.at) } },
			extraStamp: { paths: ['tmid', '_updatedAt'], stamp: { t: plan.at, s: op.site } },
			changes: [{ coll: messagesCollection, id: anchor._id, action: exists ? 'updated' : 'inserted' }],
		};
	}

	private async applyInsert(
		policy: CollectionPolicy,
		coll: Collection<Doc>,
		op: Op,
		version: VersionDoc | null,
		stamp: Stamp,
		session: ClientSession,
	): Promise<AppliedChange[]> {
		if (version?.del && !isNewer(stamp, version.del)) {
			return [];
		}
		let doc: Document = await this.fixRenamed(op.coll, { ...op.doc, _id: op.id }, session);
		const existing = await coll.findOne({ _id: op.id }, { session });
		if (existing) {
			return this.foldInto(policy, coll, existing, version, doc, stamp, session);
		}

		const changes: AppliedChange[] = [];
		for (const key of policy.unique ?? []) {
			const filter = uniqueFilter(key, doc);
			if (!filter) {
				continue;
			}
			const conflicting = await coll.findOne({ ...filter, _id: { $ne: op.id } }, { session });
			if (!conflicting) {
				continue;
			}
			const resolved = await this.resolveUnique(policy, key, coll, op, doc, stamp, conflicting, session);
			changes.push(...resolved.changes);
			if (!resolved.doc) {
				return changes;
			}
			doc = resolved.doc;
		}

		await coll.insertOne(doc as Doc, { session });
		await this.saveVersion(
			{
				...emptyVersion(op.coll, op.id),
				ins: stamp,
				v: resolvedVersions(doc, stamp),
				ua: doc._updatedAt ?? null,
			},
			session,
		);
		return [...changes, { coll: op.coll, id: op.id, action: 'inserted' }];
	}

	private async foldInto(
		policy: CollectionPolicy,
		coll: Collection<Doc>,
		target: Document,
		targetVersion: VersionDoc | null,
		incoming: Document,
		stamp: Stamp,
		session: ClientSession,
	): Promise<AppliedChange[]> {
		const { update, written } = foldUpdate(
			policy,
			{ doc: target, stampOf: fieldStamp(targetVersion, { t: 0, s: this.ctx.site }) },
			{ doc: incoming, stampOf: () => stamp },
		);
		if (!Object.keys(update).length) {
			return [];
		}
		await coll.updateOne({ _id: target._id }, update, { session });
		const after = await coll.findOne({ _id: target._id }, { session, projection: { _updatedAt: 1 } });
		const base = targetVersion ?? emptyVersion(coll.collectionName, target._id);
		let { v } = base;
		for (const [path, pathStamp] of written) {
			v = stampPaths(v, [path], pathStamp);
		}
		await this.saveVersion({ ...base, v, ua: after?._updatedAt ?? null, at: new Date() }, session);
		return [{ coll: coll.collectionName, id: target._id, action: 'updated' }];
	}

	private async resolveUnique(
		policy: CollectionPolicy,
		key: UniqueKey,
		coll: Collection<Doc>,
		op: Op,
		doc: Document,
		stamp: Stamp,
		conflicting: Document,
		session: ClientSession,
	): Promise<{ doc?: Document; changes: AppliedChange[] }> {
		const { store } = this.ctx;
		const conflictingVersion = await store.versions.findOne({ _id: versionKey(op.coll, conflicting._id) }, { session });
		const conflictingStamp = conflictingVersion?.ins ?? { t: 0, s: this.ctx.site };
		const incomingIsOlder = compareStamps(stamp, conflictingStamp) < 0;
		const policyKind = key.onConflict.kind;

		if (policyKind === 'record') {
			await store.conflicts.insertOne(
				{ _id: randomUUID(), at: new Date(), coll: op.coll, reason: `unique ${key.fields.join(',')}`, op, existingId: conflicting._id },
				{ session },
			);
			return { changes: [] };
		}

		if (policyKind === 'merge') {
			if (!incomingIsOlder) {
				await store.aliases.updateOne(
					{ _id: versionKey(op.coll, op.id) },
					{ $set: { winner: conflicting._id } },
					{ upsert: true, session },
				);
				return { changes: await this.foldInto(policy, coll, conflicting, conflictingVersion, doc, stamp, session) };
			}
			const merged = mergeDocuments(
				policy,
				{ doc, stampOf: () => stamp },
				{ doc: conflicting, stampOf: fieldStamp(conflictingVersion, conflictingStamp) },
			);
			await coll.deleteOne({ _id: conflicting._id }, { session });
			await store.aliases.updateOne({ _id: versionKey(op.coll, conflicting._id) }, { $set: { winner: op.id } }, { upsert: true, session });
			await this.saveVersion(
				{ ...emptyVersion(op.coll, op.id), ins: stamp, v: merged.versions, ua: merged.doc._updatedAt ?? null },
				session,
			);
			return {
				doc: merged.doc,
				changes: [{ coll: op.coll, id: conflicting._id, action: 'removed', before: conflicting }],
			};
		}

		const { fields, dependents = [] } = key.onConflict;
		const renameStamp = incomingIsOlder ? conflictingStamp : stamp;
		if (!incomingIsOlder) {
			const renamed = { ...doc };
			for (const field of fields) {
				if (field in renamed) {
					renamed[field] = suffixed(doc[field], op.site);
					await this.recordRename(op.coll, op.id, field, doc[field], renamed[field], renameStamp, session);
				}
			}
			return { doc: renamed, changes: [] };
		}

		const $set: Document = {};
		for (const field of fields) {
			if (field in conflicting) {
				$set[field] = suffixed(conflicting[field], conflictingStamp.s);
				await this.recordRename(op.coll, conflicting._id, field, conflicting[field], $set[field], renameStamp, session);
			}
		}
		await coll.updateOne({ _id: conflicting._id }, { $set }, { session });
		await this.stampVersion(op.coll, conflicting._id, Object.keys($set), renameStamp, undefined, session);
		const changes: AppliedChange[] = [{ coll: op.coll, id: conflicting._id, action: 'updated' }];
		for (const dependent of dependents) {
			const dependentSet: Document = {};
			for (const [field, dependentField] of Object.entries(dependent.fields)) {
				if (field in $set) {
					dependentSet[dependentField] = $set[field];
				}
			}
			if (!Object.keys(dependentSet).length) {
				continue;
			}
			const target = this.ctx.db.collection<Doc>(dependent.coll);
			const ids = (await target.find({ [dependent.foreignKey]: conflicting._id }, { session, projection: { _id: 1 } }).toArray()).map(
				({ _id }) => _id,
			);
			await target.updateMany({ _id: { $in: ids } }, { $set: dependentSet }, { session });
			changes.push(...ids.map((id) => ({ coll: dependent.coll, id, action: 'updated' as const })));
		}
		return { doc, changes };
	}

	private async recordRename(coll: string, id: string, field: string, from: unknown, to: unknown, stamp: Stamp, session: ClientSession) {
		await this.ctx.store.renames.updateOne(
			{ _id: `${versionKey(coll, id)}|${field}` },
			{ $set: { coll, id, field, from, to, stamp } },
			{ upsert: true, session },
		);
	}

	/** Keeps operations written before a rename resolved a conflict from undoing the rename. */
	private async fixRenamed(coll: string, doc: Document, session: ClientSession): Promise<Document> {
		const { store, policies } = this.ctx;
		const fixed = { ...doc };
		for (const rename of await store.renames.find({ coll, id: doc._id }, { session }).toArray()) {
			if (sameValue(fixed[rename.field], rename.from)) {
				fixed[rename.field] = rename.to;
			}
		}
		for (const policy of policies.values()) {
			for (const key of policy.unique ?? []) {
				if (key.onConflict.kind !== 'rename') {
					continue;
				}
				for (const dependent of key.onConflict.dependents ?? []) {
					const parentId = getAt(fixed, dependent.foreignKey);
					if (dependent.coll !== coll || typeof parentId !== 'string') {
						continue;
					}
					for (const rename of await store.renames.find({ coll: policy.name, id: parentId }, { session }).toArray()) {
						const dependentField = dependent.fields[rename.field];
						if (dependentField && sameValue(fixed[dependentField], rename.from)) {
							fixed[dependentField] = rename.to;
						}
					}
				}
			}
		}
		return fixed;
	}

	private async applyUpdate(
		_policy: CollectionPolicy,
		coll: Collection<Doc>,
		op: Op,
		version: VersionDoc | null,
		stamp: Stamp,
		session: ClientSession,
	): Promise<AppliedChange[]> {
		const existing = await coll.findOne({ _id: op.id }, { session });
		if (!existing) {
			return [];
		}
		if (version?.ua != null && !sameDate(existing._updatedAt, version.ua)) {
			throw new UncapturedLocalWrite();
		}
		const stampOf = fieldStamp(version, { t: 0, s: this.ctx.site });
		const fixedValues = await this.fixRenamed(op.coll, { ...existing, ...Object.fromEntries(op.set ?? []) }, session);
		const set: PathValue[] = (op.set ?? [])
			.filter(([path]) => isNewer(stamp, stampOf(path)))
			.map(([path, value]) => [path, path in fixedValues ? fixedValues[path] : value]);
		const unset = (op.unset ?? []).filter((path) => isNewer(stamp, stampOf(path)));

		const main: Document = {};
		if (set.length) {
			main.$set = Object.fromEntries(set);
		}
		if (unset.length) {
			main.$unset = Object.fromEntries(unset.map((path) => [path, 1]));
		}
		if (op.inc?.length) {
			main.$inc = Object.fromEntries(op.inc);
		}
		if (op.add?.length) {
			main.$addToSet = Object.fromEntries(op.add.map(([path, values]) => [path, { $each: values }]));
		}
		const filter: Filter<Doc> = { _id: op.id };
		if (Object.keys(main).length) {
			await coll.updateOne(filter, main, { session });
		}
		if (op.pull?.length) {
			await coll.updateOne(
				filter,
				{ $pull: Object.fromEntries(op.pull.map(([path, values]) => [path, { $in: values }])) } as UpdateFilter<Doc>,
				{ session },
			);
		}
		if (op.inc?.length) {
			await coll.updateOne(filter, { $max: Object.fromEntries(op.inc.map(([path]) => [path, 0])) }, { session });
		}
		const touched = Object.keys(main).length || op.pull?.length;
		if (!touched) {
			return [];
		}
		const after = await coll.findOne(filter, { session, projection: { _updatedAt: 1 } });
		const base = version ?? emptyVersion(op.coll, op.id);
		await this.saveVersion(
			{ ...base, v: stampPaths(base.v, [...set.map(([path]) => path), ...unset], stamp), ua: after?._updatedAt ?? null, at: new Date() },
			session,
		);
		return [{ coll: op.coll, id: op.id, action: 'updated', set, unset }];
	}

	private async applyDelete(
		coll: Collection<Doc>,
		op: Op,
		version: VersionDoc | null,
		stamp: Stamp,
		session: ClientSession,
	): Promise<AppliedChange[]> {
		const base = version ?? emptyVersion(op.coll, op.id);
		const del = base.del && !isNewer(stamp, base.del) ? base.del : stamp;
		const existing = await coll.findOne({ _id: op.id }, { session });
		if (existing) {
			await coll.deleteOne({ _id: op.id }, { session });
		}
		await this.saveVersion({ ...base, del, ua: null, at: new Date() }, session);
		return existing ? [{ coll: op.coll, id: op.id, action: 'removed', before: existing }] : [];
	}

	private async stampVersion(coll: string, id: string, paths: string[], stamp: Stamp, updatedAt: Date | undefined, session: ClientSession) {
		const base = (await this.ctx.store.versions.findOne({ _id: versionKey(coll, id) }, { session })) ?? emptyVersion(coll, id);
		await this.saveVersion(
			{ ...base, v: stampPaths(base.v, paths, stamp), ...(updatedAt ? { ua: updatedAt } : {}), at: new Date() },
			session,
		);
	}

	private async saveVersion(version: VersionDoc, session: ClientSession): Promise<void> {
		await this.ctx.store.versions.replaceOne({ _id: version._id }, version, { upsert: true, session });
	}

	private async publish(changes: AppliedChange[]): Promise<void> {
		if (!changes.length) {
			return;
		}
		const latest = new Map<string, AppliedChange>();
		for (const change of changes) {
			const key = versionKey(change.coll, change.id);
			const previous = latest.get(key);
			latest.set(key, previous?.action === 'inserted' && change.action === 'updated' ? previous : change);
		}
		const published = await Promise.all(
			[...latest.values()].map(async (change) =>
				change.action === 'removed'
					? change
					: { ...change, doc: (await this.ctx.db.collection<Doc>(change.coll).findOne({ _id: change.id })) ?? undefined },
			),
		);
		try {
			await this.notifier(published.filter((change) => change.action === 'removed' || change.doc));
		} catch (err) {
			this.ctx.logger.error('notifier failed', { err: String(err) });
		}
	}
}

const uniqueFilter = (key: UniqueKey, doc: Document): Filter<Doc> | undefined => {
	const filter: Filter<Doc> = {};
	for (const field of key.fields) {
		const value = getAt(doc, field);
		if (value === undefined && key.sparse) {
			return undefined;
		}
		filter[field] = value ?? null;
	}
	return filter;
};

const resolvedVersions = (doc: Document, stamp: Stamp): VersionDoc['v'] =>
	stampPaths(
		[],
		Object.keys(doc).filter((key) => key !== '_id'),
		stamp,
	);

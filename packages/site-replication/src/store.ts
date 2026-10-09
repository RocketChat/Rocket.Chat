import type { Collection, Db, ResumeToken } from 'mongodb';

import type { HealPlan } from './heal/plan';
import type { Op, Stamp } from './types';
import type { VersionDoc } from './versions';

export type CaptureState = { _id: 'capture'; seq: number; token?: ResumeToken };

/** Progress with the peer, in the peer's sequence numbers for `applied` and ours for `acked`. */
export type PeerState = { _id: `peer:${string}`; acked: number; applied: number };

export type LinkState = { _id: 'link'; downSince?: number | null; healing?: boolean };

export type SessionsState = { _id: 'sessions'; ids: string[] };

export type LeaderState = { _id: 'leader'; owner: string; expiresAt: Date };

export type StateDoc = CaptureState | PeerState | LinkState | SessionsState | LeaderState;

export type OutboxEntry = Op & { _id: number };

export type AliasDoc = { _id: string; winner: string };

export type RenameDoc = { _id: string; coll: string; id: string; field: string; from: unknown; to: unknown; stamp: Stamp };

export type ConflictDoc = {
	_id: string;
	at: Date;
	coll: string;
	reason: string;
	op: Op;
	existingId?: string;
};

export type FenceDoc = { _id: string; at: Date };

export type Store = {
	state: Collection<StateDoc>;
	outbox: Collection<OutboxEntry>;
	versions: Collection<VersionDoc>;
	aliases: Collection<AliasDoc>;
	renames: Collection<RenameDoc>;
	conflicts: Collection<ConflictDoc>;
	fence: Collection<FenceDoc>;
	heals: Collection<HealPlan>;
};

export const STORE_PREFIX = 'rocketchat_site_replication';

/** The replicator's own bookkeeping. None of it replicates: each site keeps its own. */
export const openStore = (db: Db): Store => ({
	state: db.collection<StateDoc>(`${STORE_PREFIX}_state`),
	outbox: db.collection<OutboxEntry>(`${STORE_PREFIX}_outbox`),
	versions: db.collection<VersionDoc>(`${STORE_PREFIX}_versions`),
	aliases: db.collection<AliasDoc>(`${STORE_PREFIX}_aliases`),
	renames: db.collection<RenameDoc>(`${STORE_PREFIX}_renames`),
	conflicts: db.collection<ConflictDoc>(`${STORE_PREFIX}_conflicts`),
	fence: db.collection<FenceDoc>(`${STORE_PREFIX}_fence`),
	heals: db.collection<HealPlan>(`${STORE_PREFIX}_heals`),
});

export const ensureStoreIndexes = async (store: Store, versionRetentionSeconds: number): Promise<void> => {
	await Promise.all([
		store.versions.createIndex({ at: 1 }, { expireAfterSeconds: versionRetentionSeconds }),
		store.fence.createIndex({ at: 1 }, { expireAfterSeconds: 3600 }),
		store.outbox.createIndex({ 'coll': 1, 'kind': 1, 'doc.rid': 1 }),
		store.renames.createIndex({ coll: 1, id: 1 }),
	]);
};

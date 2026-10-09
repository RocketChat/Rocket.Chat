import type { Document } from 'mongodb';

export type SiteId = string;

/**
 * When and where a write happened. Every site orders two stamps the same way (time, then site id),
 * so concurrent writes to one field resolve to the same winner everywhere.
 */
export type Stamp = { t: number; s: SiteId };

export type PathValue = [path: string, value: unknown];
export type PathDelta = [path: string, delta: number];
export type PathValues = [path: string, values: unknown[]];

/**
 * One captured change, in the form the peer applies it. Field paths travel as tuples because
 * MongoDB update paths contain dots, which cannot be stored as document keys.
 */
export type Op = {
	seq: number;
	site: SiteId;
	t: number;
	coll: string;
	id: string;
	kind: 'insert' | 'update' | 'delete';
	doc?: Document;
	set?: PathValue[];
	unset?: string[];
	inc?: PathDelta[];
	add?: PathValues[];
	pull?: PathValues[];
};

export type UniqueConflictPolicy =
	/** Both documents describe the same thing: the one created first keeps its id and absorbs the other. */
	| { kind: 'merge' }
	/** Both documents are distinct: the one created later gets its unique fields suffixed with its site id. */
	| {
			kind: 'rename';
			fields: string[];
			dependents?: { coll: string; foreignKey: string; fields: Record<string, string> }[];
	  }
	/** No safe automatic resolution: the incoming document is kept aside for an administrator. */
	| { kind: 'record' };

export type UniqueKey = {
	fields: string[];
	sparse?: boolean;
	onConflict: UniqueConflictPolicy;
};

/**
 * How one collection replicates. Paths may use `*` for one path segment of any name.
 * Counter paths travel as increments, set paths as additions and removals, and every other
 * path as a last-writer-wins value.
 */
export type CollectionPolicy = {
	name: string;
	counters?: string[];
	sets?: string[];
	localFields?: string[];
	localIds?: string[];
	unique?: UniqueKey[];
};

export type AppliedChange = {
	coll: string;
	id: string;
	action: 'inserted' | 'updated' | 'removed';
	/** The document after the change; absent for removals. */
	doc?: Document;
	/** The document before a removal. */
	before?: Document;
	/** The paths this change set or unset, for listeners that publish diffs. */
	set?: PathValue[];
	unset?: string[];
};

/** Receives every change the peer's writes made here, after it is committed, so the host can publish it. */
export type Notifier = (changes: AppliedChange[]) => void | Promise<void>;

export type Logger = {
	debug(msg: string, extra?: Record<string, unknown>): void;
	info(msg: string, extra?: Record<string, unknown>): void;
	warn(msg: string, extra?: Record<string, unknown>): void;
	error(msg: string, extra?: Record<string, unknown>): void;
};

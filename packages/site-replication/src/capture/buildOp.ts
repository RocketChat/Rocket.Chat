import type { Document } from 'mongodb';

import { classifyPath, getAt, isPlainObject, joinPath, sameValue, canonical, withoutLocalFields } from '../paths';
import type { CollectionPolicy, Op, SiteId } from '../types';

/** The parts of a change stream event that decide what to replicate. */
export type CapturedEvent = {
	operationType: 'insert' | 'update' | 'replace' | 'delete';
	id: string;
	t: number;
	fullDocument?: Document | null;
	fullDocumentBeforeChange?: Document | null;
	updateDescription?: {
		updatedFields?: Document;
		removedFields?: string[];
		truncatedArrays?: { field: string; newSize: number }[];
	};
};

export type UnsequencedOp = Omit<Op, 'seq'>;

class UpdateBuilder {
	readonly set = new Map<string, unknown>();

	readonly unset = new Set<string>();

	readonly inc = new Map<string, number>();

	readonly add = new Map<string, unknown[]>();

	readonly pull = new Map<string, unknown[]>();

	private readonly handledInstances = new Set<string>();

	constructor(
		private readonly policy: CollectionPolicy,
		private readonly pre: Document | undefined,
		private readonly post: Document | undefined,
	) {}

	private assign(path: string, value: unknown): void {
		if (value === undefined) {
			this.unset.add(path);
		} else {
			this.set.set(path, value);
		}
	}

	/** Records one changed path; `value` is undefined when the path was removed. */
	change(path: string, value: unknown): void {
		const cls = classifyPath(this.policy, path);
		switch (cls.kind) {
			case 'local':
				return;
			case 'counter':
				return this.counter(cls.instance, path, value);
			case 'set':
				return this.arraySet(cls.instance, path, value);
			case 'ancestor':
				if (!this.pre || !this.post) {
					return this.assign(path, value);
				}
				return this.walk(path, getAt(this.pre, path), getAt(this.post, path));
			case 'plain':
				return this.assign(path, value);
		}
	}

	private valueIfWhole(instance: string, path: string, value: unknown): unknown {
		return path === instance ? value : undefined;
	}

	private instanceValues(instance: string, path: string, value: unknown): { before: unknown; after: unknown; complete: boolean } {
		const after = this.post ? getAt(this.post, instance) : this.valueIfWhole(instance, path, value);
		const complete = !!this.pre && (!!this.post || path === instance);
		return { before: this.pre ? getAt(this.pre, instance) : undefined, after, complete };
	}

	private counter(instance: string, path: string, value: unknown): void {
		if (this.handledInstances.has(instance)) {
			return;
		}
		this.handledInstances.add(instance);
		const { before, after, complete } = this.instanceValues(instance, path, value);
		if (!complete) {
			return this.assign(instance, after);
		}
		const delta = (typeof after === 'number' ? after : 0) - (typeof before === 'number' ? before : 0);
		if (delta !== 0) {
			this.inc.set(instance, delta);
		}
	}

	private arraySet(instance: string, path: string, value: unknown): void {
		if (this.handledInstances.has(instance)) {
			return;
		}
		this.handledInstances.add(instance);
		const { before, after, complete } = this.instanceValues(instance, path, value);
		if (!complete || (after !== undefined && !Array.isArray(after))) {
			return this.assign(instance, after);
		}
		const beforeItems = Array.isArray(before) ? before : [];
		const afterItems = Array.isArray(after) ? after : [];
		const beforeKeys = new Set(beforeItems.map(canonical));
		const afterKeys = new Set(afterItems.map(canonical));
		const added = afterItems.filter((item) => !beforeKeys.has(canonical(item)));
		const removed = beforeItems.filter((item) => !afterKeys.has(canonical(item)));
		if (added.length) {
			this.add.set(instance, added);
		}
		if (removed.length) {
			this.pull.set(instance, removed);
		}
	}

	/** Splits a change to a path that contains counters or sets into changes to its parts. */
	walk(path: string, before: unknown, after: unknown): void {
		const cls = path === '' ? ({ kind: 'ancestor' } as const) : classifyPath(this.policy, path);
		switch (cls.kind) {
			case 'local':
				return;
			case 'counter':
				return this.counter(cls.instance, path, after);
			case 'set':
				return this.arraySet(cls.instance, path, after);
			case 'ancestor': {
				const beforeIsObject = before === undefined || isPlainObject(before);
				const afterIsObject = after === undefined || isPlainObject(after);
				if (!beforeIsObject || !afterIsObject || (before === undefined && after === undefined)) {
					return this.assign(path, after);
				}
				const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
				if (path === '') {
					keys.delete('_id');
				}
				if (keys.size === 0 && after !== undefined && before === undefined) {
					return this.assign(path, after);
				}
				for (const key of keys) {
					this.walk(joinPath(path, key), before?.[key], after?.[key]);
				}
				return;
			}
			case 'plain':
				if (!sameValue(before, after)) {
					this.assign(path, after);
				}
		}
	}

	/** Paths whose parent is also written: MongoDB rejects both in one update, and the parent's value already covers them. */
	private shadowedPaths(): Set<string> {
		const written = [...this.set.keys(), ...this.unset];
		return new Set(written.filter((path) => written.some((other) => path.startsWith(`${other}.`))));
	}

	toOp(base: Omit<UnsequencedOp, 'kind'>): UnsequencedOp | undefined {
		const op: UnsequencedOp = { ...base, kind: 'update' };
		const shadowed = this.shadowedPaths();
		const set = [...this.set].filter(([path]) => !shadowed.has(path));
		const unset = [...this.unset].filter((path) => !shadowed.has(path));
		if (set.length) {
			op.set = set;
		}
		if (unset.length) {
			op.unset = unset;
		}
		if (this.inc.size) {
			op.inc = [...this.inc];
		}
		if (this.add.size) {
			op.add = [...this.add];
		}
		if (this.pull.size) {
			op.pull = [...this.pull];
		}
		return op.set || op.unset || op.inc || op.add || op.pull ? op : undefined;
	}
}

/**
 * Turns one local change into the operation the peer must apply to reach the same state,
 * or undefined when nothing about the change replicates.
 */
export const buildOp = (policy: CollectionPolicy, site: SiteId, event: CapturedEvent): UnsequencedOp | undefined => {
	if (policy.localIds?.includes(event.id)) {
		return undefined;
	}
	const base = { site, t: event.t, coll: policy.name, id: event.id };
	const pre = event.fullDocumentBeforeChange ?? undefined;
	const post = event.fullDocument ?? undefined;

	switch (event.operationType) {
		case 'insert':
			return post ? { ...base, kind: 'insert', doc: withoutLocalFields(policy, post) } : undefined;
		case 'delete':
			return { ...base, kind: 'delete' };
		case 'replace': {
			if (!post) {
				return undefined;
			}
			const builder = new UpdateBuilder(policy, pre, post);
			if (pre) {
				builder.walk('', pre, post);
			} else {
				for (const [key, value] of Object.entries(post)) {
					if (key !== '_id') {
						builder.change(key, value);
					}
				}
			}
			return builder.toOp(base);
		}
		case 'update': {
			const builder = new UpdateBuilder(policy, pre, post);
			const description = event.updateDescription ?? {};
			for (const [path, value] of Object.entries(description.updatedFields ?? {})) {
				builder.change(path, value);
			}
			for (const path of description.removedFields ?? []) {
				builder.change(path, undefined);
			}
			for (const { field } of description.truncatedArrays ?? []) {
				builder.change(field, post ? getAt(post, field) : undefined);
			}
			return builder.toOp(base);
		}
	}
};

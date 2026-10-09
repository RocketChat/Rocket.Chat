import { BSON } from 'mongodb';
import type { Document } from 'mongodb';

import type { CollectionPolicy } from './types';

export const segments = (path: string): string[] => (path === '' ? [] : path.split('.'));

export const joinPath = (base: string, key: string): string => (base ? `${base}.${key}` : key);

type PatternRelation = { kind: 'equal' } | { kind: 'inside'; instance: string } | { kind: 'ancestor' } | undefined;

/** Where `path` sits relative to the places `pattern` (with `*` wildcards) can name. */
export const relate = (pattern: string, path: string): PatternRelation => {
	const p = segments(pattern);
	const q = segments(path);
	const shared = Math.min(p.length, q.length);
	for (let i = 0; i < shared; i++) {
		if (p[i] !== '*' && p[i] !== q[i]) {
			return undefined;
		}
	}
	if (q.length === p.length) {
		return { kind: 'equal' };
	}
	if (q.length > p.length) {
		return { kind: 'inside', instance: q.slice(0, p.length).join('.') };
	}
	return { kind: 'ancestor' };
};

export type PathClass =
	{ kind: 'counter'; instance: string } | { kind: 'set'; instance: string } | { kind: 'local' } | { kind: 'ancestor' } | { kind: 'plain' };

/** How a changed path replicates under a collection policy. */
export const classifyPath = (policy: CollectionPolicy, path: string): PathClass => {
	let ancestor = false;
	for (const pattern of policy.localFields ?? []) {
		const rel = relate(pattern, path);
		if (rel?.kind === 'equal' || rel?.kind === 'inside') {
			return { kind: 'local' };
		}
		ancestor ||= rel?.kind === 'ancestor';
	}
	for (const [kind, patterns] of [
		['counter', policy.counters ?? []],
		['set', policy.sets ?? []],
	] as const) {
		for (const pattern of patterns) {
			const rel = relate(pattern, path);
			if (rel?.kind === 'equal') {
				return { kind, instance: path };
			}
			if (rel?.kind === 'inside') {
				return { kind, instance: rel.instance };
			}
			ancestor ||= rel?.kind === 'ancestor';
		}
	}
	return ancestor ? { kind: 'ancestor' } : { kind: 'plain' };
};

/** True when writing one path can change the value at the other. */
export const pathsOverlap = (a: string, b: string): boolean => {
	const p = segments(a);
	const q = segments(b);
	const shared = Math.min(p.length, q.length);
	for (let i = 0; i < shared; i++) {
		if (p[i] !== q[i]) {
			return false;
		}
	}
	return true;
};

export const getAt = (doc: unknown, path: string): unknown => {
	let current: unknown = doc;
	for (const key of segments(path)) {
		if (current === null || typeof current !== 'object') {
			return undefined;
		}
		current = (current as Record<string, unknown>)[key];
	}
	return current;
};

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
};

/** A string that is equal for two values exactly when MongoDB would store them identically. */
export const canonical = (value: unknown): string => (value === undefined ? 'undefined' : BSON.EJSON.stringify(value, { relaxed: false }));

export const sameValue = (a: unknown, b: unknown): boolean => canonical(a) === canonical(b);

/** A copy of `doc` without the parts a pattern names. */
export const withoutPattern = (doc: Document, pattern: string): Document => {
	const [head, ...rest] = segments(pattern);
	const keys = head === '*' ? Object.keys(doc) : [head];
	const copy: Document = { ...doc };
	for (const key of keys) {
		if (!(key in copy)) {
			continue;
		}
		if (rest.length === 0) {
			delete copy[key];
		} else if (isPlainObject(copy[key])) {
			copy[key] = withoutPattern(copy[key], rest.join('.'));
		}
	}
	return copy;
};

export const withoutLocalFields = (policy: CollectionPolicy, doc: Document): Document =>
	(policy.localFields ?? []).reduce((acc, pattern) => withoutPattern(acc, pattern), doc);

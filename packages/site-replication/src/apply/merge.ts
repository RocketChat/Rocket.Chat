import type { Document } from 'mongodb';

import { canonical, classifyPath } from '../paths';
import type { CollectionPolicy, Stamp } from '../types';
import { isNewer, newestOverlapping, stampPaths } from '../versions';
import type { VersionDoc } from '../versions';

type Side = { doc: Document; stampOf: (path: string) => Stamp };

export const fieldStamp =
	(version: VersionDoc | undefined | null, fallback: Stamp) =>
	(path: string): Stamp =>
		newestOverlapping(version, path) ?? version?.ins ?? fallback;

const union = (a: unknown, b: unknown): unknown[] => {
	const seen = new Set<string>();
	return [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])].filter((item) => {
		const key = canonical(item);
		if (seen.has(key)) {
			return false;
		}
		seen.add(key);
		return true;
	});
};

/**
 * One document holding both sides of two documents that describe the same thing: counters add up,
 * sets join, and each other field keeps the newer write. `winner` keeps its id.
 */
export const mergeDocuments = (policy: CollectionPolicy, winner: Side, loser: Side): { doc: Document; versions: VersionDoc['v'] } => {
	const doc: Document = { _id: winner.doc._id };
	let versions: VersionDoc['v'] = [];
	const keys = new Set([...Object.keys(winner.doc), ...Object.keys(loser.doc)]);
	keys.delete('_id');
	for (const key of keys) {
		const { kind } = classifyPath(policy, key);
		if (kind === 'counter') {
			doc[key] = (Number(winner.doc[key]) || 0) + (Number(loser.doc[key]) || 0);
			continue;
		}
		if (kind === 'set') {
			doc[key] = union(winner.doc[key], loser.doc[key]);
			continue;
		}
		const fromWinner = key in winner.doc;
		const fromLoser = key in loser.doc;
		const winnerStamp = winner.stampOf(key);
		const loserStamp = loser.stampOf(key);
		const useLoser = fromLoser && (!fromWinner || isNewer(loserStamp, winnerStamp));
		doc[key] = useLoser ? loser.doc[key] : winner.doc[key];
		versions = stampPaths(versions, [key], useLoser ? loserStamp : winnerStamp);
	}
	return { doc, versions };
};

/** The update that folds `incoming` into an existing document by the same rules as `mergeDocuments`. */
export const foldUpdate = (policy: CollectionPolicy, target: Side, incoming: Side): { update: Document; written: [string, Stamp][] } => {
	const $set: Document = {};
	const $inc: Document = {};
	const $addToSet: Document = {};
	const written: [string, Stamp][] = [];
	for (const [key, value] of Object.entries(incoming.doc)) {
		if (key === '_id') {
			continue;
		}
		const { kind } = classifyPath(policy, key);
		if (kind === 'counter') {
			if (typeof value === 'number' && value !== 0) {
				$inc[key] = value;
			}
		} else if (kind === 'set') {
			if (Array.isArray(value) && value.length) {
				$addToSet[key] = { $each: value };
			}
		} else if (!(key in target.doc) || isNewer(incoming.stampOf(key), target.stampOf(key))) {
			$set[key] = value;
			written.push([key, incoming.stampOf(key)]);
		}
	}
	const update: Document = {};
	if (Object.keys($set).length) {
		update.$set = $set;
	}
	if (Object.keys($inc).length) {
		update.$inc = $inc;
	}
	if (Object.keys($addToSet).length) {
		update.$addToSet = $addToSet;
	}
	return { update, written };
};

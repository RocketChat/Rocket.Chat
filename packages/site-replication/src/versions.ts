import { pathsOverlap } from './paths';
import type { SiteId, Stamp } from './types';

export type FieldVersion = { p: string; t: number; s: SiteId };

/**
 * What this site knows about the last write to each field of one replicated document, kept so a late
 * write from the peer can be told apart from a newer one.
 */
export type VersionDoc = {
	_id: string;
	v: FieldVersion[];
	/** When the document was created. Decides which of two conflicting documents wins. */
	ins?: Stamp;
	/** When the document was deleted. A delete wins over every write stamped before it. */
	del?: Stamp;
	/** The document's `_updatedAt` as of the last write the replicator saw, to detect writes it has not captured yet. */
	ua?: Date | null;
	at: Date;
};

export const versionKey = (coll: string, id: string): string => `${coll}|${id}`;

const compareSites = (a: string, b: string): number => {
	if (a === b) {
		return 0;
	}
	return a < b ? -1 : 1;
};

export const compareStamps = (a: Stamp, b: Stamp): number => a.t - b.t || compareSites(a.s, b.s);

export const isNewer = (candidate: Stamp, current: Stamp | undefined): boolean => !current || compareStamps(candidate, current) > 0;

export const newestOverlapping = (version: VersionDoc | undefined | null, path: string): Stamp | undefined => {
	let newest: Stamp | undefined;
	for (const entry of version?.v ?? []) {
		if (pathsOverlap(entry.p, path) && isNewer(entry, newest)) {
			newest = { t: entry.t, s: entry.s };
		}
	}
	return newest;
};

/** The newest stamp among writes to any of `paths`, so a new write can be stamped after all of them. */
export const newestAmong = (version: VersionDoc | undefined | null, paths: string[]): Stamp | undefined =>
	paths.reduce<Stamp | undefined>((newest, path) => {
		const candidate = newestOverlapping(version, path);
		return candidate && isNewer(candidate, newest) ? candidate : newest;
	}, undefined);

export const stampPaths = (entries: FieldVersion[], paths: string[], stamp: Stamp): FieldVersion[] => {
	const kept = entries.filter((entry) => !paths.some((path) => entry.p === path || entry.p.startsWith(`${path}.`)));
	return [...kept, ...paths.map((p) => ({ p, t: stamp.t, s: stamp.s }))];
};

export const emptyVersion = (coll: string, id: string): VersionDoc => ({ _id: versionKey(coll, id), v: [], at: new Date() });

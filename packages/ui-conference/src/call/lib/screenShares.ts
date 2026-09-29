import type { RemoteParticipantInfo } from '../context';
import type { StageSelf } from './stageTiles';

export type ScreenShare = { id: string; stream: MediaStream; label: string; isLocal: boolean };

/** When each share started, by participant: a new stream from the same person is a new share. */
export type ShareStarts = ReadonlyMap<string, { stream: MediaStream; startedAt: number }>;

/** Every screen being shared right now, the reader's first. */
export const collectScreenShares = (
	self: Pick<StageSelf, 'id' | 'screenStream'>,
	remoteParticipants: RemoteParticipantInfo[],
): ScreenShare[] => [
	...(self.screenStream ? [{ id: self.id, stream: self.screenStream, label: 'You — screen', isLocal: true }] : []),
	...remoteParticipants.flatMap((p) =>
		p.screenStream ? [{ id: p.id, stream: p.screenStream, label: `${p.displayName} — screen`, isLocal: false }] : [],
	),
];

/** Brings the start times up to date with the shares on screen, and says which share started last, if any did. */
export const recordShareStarts = (
	starts: ShareStarts,
	shares: ScreenShare[],
	now: number,
): { starts: Map<string, { stream: MediaStream; startedAt: number }>; started: string | null } => {
	const next = new Map<string, { stream: MediaStream; startedAt: number }>();
	let started: string | null = null;
	for (const { id, stream } of shares) {
		const existing = starts.get(id);
		if (existing?.stream === stream) {
			next.set(id, existing);
		} else {
			next.set(id, { stream, startedAt: now });
			started = id;
		}
	}
	return { starts: next, started };
};

/** A share that just started takes the pin; a pinned share that stopped gives it up. */
export const nextPinnedScreen = (pinned: string | null, started: string | null, shares: ScreenShare[]): string | null => {
	if (started !== null) return started;
	if (pinned && !shares.some(({ id }) => id === pinned)) return null;
	return pinned;
};

/** The share shown large: the pinned one while it lasts, else whichever started last. */
export const pickFeaturedScreen = (shares: ScreenShare[], pinned: string | null, starts: ShareStarts): ScreenShare | null => {
	if (shares.length === 0) return null;
	const pinnedShare = pinned ? shares.find(({ id }) => id === pinned) : undefined;
	if (pinnedShare) return pinnedShare;
	return [...shares].sort((a, b) => (starts.get(b.id)?.startedAt ?? 0) - (starts.get(a.id)?.startedAt ?? 0))[0];
};

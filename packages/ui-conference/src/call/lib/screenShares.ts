import type { RemoteParticipantInfo } from '../context';
import type { StageSelf } from './stageTiles';

/** `name` is who is sharing, when it is not the reader. */
export type ScreenShare = { id: string; stream: MediaStream } & ({ isLocal: true } | { isLocal: false; name: string });

/** When each share started, by participant: a new stream from the same person is a new share. */
export type ShareStarts = ReadonlyMap<string, { stream: MediaStream; startedAt: number }>;

/** Every screen being shared right now, the reader's first. */
export const collectScreenShares = (
	self: Pick<StageSelf, 'id' | 'screenStream'>,
	remoteParticipants: RemoteParticipantInfo[],
): ScreenShare[] => [
	...(self.screenStream ? [{ id: self.id, stream: self.screenStream, isLocal: true as const }] : []),
	...remoteParticipants.flatMap((p) =>
		p.screenStream ? [{ id: p.id, stream: p.screenStream, name: p.displayName, isLocal: false as const }] : [],
	),
];

/** The start times brought up to date with the shares on screen. */
export const recordShareStarts = (starts: ShareStarts, shares: ScreenShare[], now: number): ShareStarts => {
	const next = new Map<string, { stream: MediaStream; startedAt: number }>();
	for (const { id, stream } of shares) {
		const existing = starts.get(id);
		next.set(id, existing?.stream === stream ? existing : { stream, startedAt: now });
	}
	return next;
};

/** The share shown large: the pinned one while it lasts, else whichever started last. */
export const pickFeaturedScreen = (shares: ScreenShare[], pinned: string | null, starts: ShareStarts): ScreenShare | null => {
	if (shares.length === 0) return null;
	const pinnedShare = pinned ? shares.find(({ id }) => id === pinned) : undefined;
	if (pinnedShare) return pinnedShare;
	return [...shares].sort((a, b) => (starts.get(b.id)?.startedAt ?? 0) - (starts.get(a.id)?.startedAt ?? 0))[0];
};

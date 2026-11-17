import type { RemoteParticipantInfo } from '../context';
import type { StageSelf, TilePin } from './stageTiles';

/** `name` is who is sharing, absent for the reader's own share. */
export type ScreenShare = { id: string; stream: MediaStream; name?: string; isLocal: boolean };

/** A share as the stage draws it, with its pin. */
export type StageScreen = ScreenShare & { pin: TilePin };

/** When each share started, by participant: a new stream from the same person is a new share. */
export type ShareStarts = ReadonlyMap<string, { stream: MediaStream; startedAt: number }>;

/** Every screen being shared right now, the reader's first. */
export const collectScreenShares = (
	self: Pick<StageSelf, 'id' | 'screenStream'>,
	remoteParticipants: RemoteParticipantInfo[],
): ScreenShare[] => [
	...(self.screenStream ? [{ id: self.id, stream: self.screenStream, isLocal: true }] : []),
	...remoteParticipants.flatMap((p) => (p.screenStream ? [{ id: p.id, stream: p.screenStream, name: p.displayName, isLocal: false }] : [])),
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

/**
 * What the reader decided about the shares: the one they chose to see large, or that they unpinned the share on the
 * stage and want their layout back. Shares that start change neither.
 */
export type ScreenChoice = { chosen: string | null; dismissed: boolean };

export const NO_SCREEN_CHOICE: ScreenChoice = { chosen: null, dismissed: false };

/** A chosen share that stopped ends the choice; once nobody shares, the next share is welcome on the stage again. */
export const nextScreenChoice = ({ chosen, dismissed }: ScreenChoice, shares: ScreenShare[]): ScreenChoice => ({
	chosen: chosen !== null && shares.some(({ id }) => id === chosen) ? chosen : null,
	dismissed: dismissed && shares.length > 0,
});

/** The share shown large: none once the reader unpinned it, else the chosen one, else whichever started last. */
export const pickFeaturedScreen = (shares: ScreenShare[], { chosen, dismissed }: ScreenChoice, starts: ShareStarts): ScreenShare | null => {
	if (shares.length === 0 || dismissed) return null;
	const chosenShare = chosen !== null ? shares.find(({ id }) => id === chosen) : undefined;
	if (chosenShare) return chosenShare;
	return [...shares].sort((a, b) => (starts.get(b.id)?.startedAt ?? 0) - (starts.get(a.id)?.startedAt ?? 0))[0];
};

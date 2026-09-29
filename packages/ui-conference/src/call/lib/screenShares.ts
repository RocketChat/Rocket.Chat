import type { RemoteParticipantInfo } from '../context';
import type { StageSelf } from './stageTiles';

/** `name` is who is sharing, absent for the reader's own share. */
export type ScreenShare = { id: string; stream: MediaStream; name?: string; isLocal: boolean };

/** Every screen being shared right now, the reader's first. */
export const collectScreenShares = (
	self: Pick<StageSelf, 'id' | 'screenStream'>,
	remoteParticipants: RemoteParticipantInfo[],
): ScreenShare[] => [
	...(self.screenStream ? [{ id: self.id, stream: self.screenStream, isLocal: true }] : []),
	...remoteParticipants.flatMap((p) => (p.screenStream ? [{ id: p.id, stream: p.screenStream, name: p.displayName, isLocal: false }] : [])),
];

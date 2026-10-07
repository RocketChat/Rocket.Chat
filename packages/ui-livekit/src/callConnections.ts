import type { Room } from 'livekit-client';

/** This server's own SFU: where the reader publishes, and where the other members of this server do. */
export const OWN_SFU = { local: true } as const;

/** The SFU a connection leads to. */
export type CallSFU = typeof OWN_SFU;

/** A connection the call holds, and the SFU it leads to. */
export type CallConnection = { sfu: CallSFU; room: Room };

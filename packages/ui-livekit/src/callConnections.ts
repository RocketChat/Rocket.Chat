import type { Room } from 'livekit-client';

/** This server's own SFU: where the reader publishes, and where the other members of this server do. */
export const OWN_SFU = { local: true } as const;

/** Another homeserver's SFU in a federated call, where the members that homeserver hosts publish. */
export type RemoteSFU = {
	local: false;
	/** Tells one remote SFU from another. */
	key: string;
	serverName: string;
	transport: string;
};

/** The SFU a connection leads to. */
export type CallSFU = typeof OWN_SFU | RemoteSFU;

/** A connection the call holds, and the SFU it leads to. */
export type CallConnection = { sfu: CallSFU; room: Room };

/** A subscribe-only connection to another homeserver's SFU. */
export type RemoteSFUConnection = { sfu: RemoteSFU; room: Room };

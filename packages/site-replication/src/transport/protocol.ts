import type { HealRequest, HealSide } from '../heal/plan';
import type { Op, SiteId } from '../types';

export type HelloResponse = {
	site: SiteId;
	name: string;
	/** The caller's operations this site has applied. */
	applied: number;
};

export type OpsRequest = { from: SiteId; ops: Op[] };

/** `busy` means the site is agreeing a merge plan and will take operations again once it has one. */
export type OpsResponse = { applied: number } | { busy: true };

export type HealResponse = { responder: HealSide };

export type PeerHandlers = {
	hello(from: SiteId): Promise<HelloResponse>;
	ops(request: OpsRequest): Promise<OpsResponse>;
	heal(request: HealRequest): Promise<HealResponse>;
	poke(from: SiteId): Promise<void>;
};

export const PROTOCOL_PREFIX = '/site-replication/v1';

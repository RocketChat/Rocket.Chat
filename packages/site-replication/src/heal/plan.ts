import { createHash } from 'crypto';

import type { Document } from 'mongodb';

import type { SiteId } from '../types';

/** One site's part of a reconnection: the operations the other site has not applied yet, and where they posted. */
export type HealSide = {
	site: SiteId;
	name: string;
	downSince: number | null;
	/** Operations after this sequence number were not applied by the other site when the link came back. */
	from: number;
	/** Operations up to this sequence number count as written while disconnected. */
	cut: number;
	/** Rooms with top-level messages among those operations. */
	rooms: string[];
};

export type HealRequest = {
	healId: string;
	at: number;
	thresholdMs: number;
	initiator: HealSide;
	/** The responder's operations the initiator has applied. */
	responderFrom: number;
};

/**
 * How both sites fold the messages written while they were disconnected. Both sites derive the same
 * plan from the same handshake, so they rewrite the same messages the same way without coordinating further.
 */
export type HealPlan = {
	_id: string;
	at: number;
	window: { from: number; to: number };
	sides: HealSide[];
	/** Rooms where both sides posted while disconnected: each side's messages there move into a thread. */
	rooms: string[];
	localRethreadDone?: boolean;
};

export const buildPlan = (request: HealRequest, responder: HealSide): HealPlan => {
	const { initiator } = request;
	const downs = [initiator.downSince, responder.downSince].filter((value): value is number => typeof value === 'number');
	const outageFrom = downs.length ? Math.min(...downs) : request.at;
	const wasPartitioned = request.at - outageFrom >= request.thresholdMs;
	const rooms = wasPartitioned ? initiator.rooms.filter((rid) => responder.rooms.includes(rid)).sort() : [];
	return {
		_id: request.healId,
		at: request.at,
		window: { from: outageFrom, to: request.at },
		sides: [initiator, responder],
		rooms,
	};
};

export const sideOf = (plan: HealPlan, site: SiteId): HealSide | undefined => plan.sides.find((side) => side.site === site);

/** Whether an operation from `site` with this sequence number was written while disconnected. */
export const isInBacklog = (plan: HealPlan, site: SiteId, seq: number): boolean => {
	const side = sideOf(plan, site);
	return !!side && seq > side.from && seq <= side.cut;
};

/** Messages that can move into a thread: plain top-level messages, not system messages, replies or discussions. */
export const isThreadable = (message: Document): boolean => !message.t && !message.tmid && !message.drid;

const UNMISTAKABLE_CHARS = '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz';

/** A Rocket.Chat-shaped id that every site derives identically from the same inputs. */
export const deterministicId = (...parts: string[]): string => {
	const digest = createHash('sha256').update(parts.join('|')).digest();
	return Array.from(digest.subarray(0, 17), (byte) => UNMISTAKABLE_CHARS[byte % UNMISTAKABLE_CHARS.length]).join('');
};

export const anchorId = (plan: HealPlan, site: SiteId, rid: string): string =>
	deterministicId('site-replication-anchor', plan._id, site, rid);

const formatUtc = (time: number): string => new Date(time).toISOString().slice(0, 16).replace('T', ' ');

export const ANCHOR_AUTHOR = { _id: 'rocket.cat', username: 'rocket.cat', name: 'Rocket.Cat' };

/** The message that heads one site's thread of disconnected messages in one room. */
export const anchorMessage = (plan: HealPlan, site: SiteId, rid: string, firstMessageTs: Date): Document => {
	const side = sideOf(plan, site);
	return {
		_id: anchorId(plan, site, rid),
		rid,
		ts: new Date(firstMessageTs.getTime() - 1),
		msg: `Messages sent at ${side?.name ?? site} while the sites were disconnected (${formatUtc(plan.window.from)} – ${formatUtc(plan.window.to)} UTC)`,
		u: ANCHOR_AUTHOR,
		groupable: false,
		_updatedAt: new Date(plan.at),
		tcount: 0,
		replies: [],
		tlm: firstMessageTs,
		siteReplication: { heal: plan._id, site },
	};
};

import type { ActiveReaction } from '@rocket.chat/ui-conference';

/** How long a reaction stays in state: the length of its animation, and a little over. */
export const REACTION_TTL_MS = 3500;

export type HandMessage = {
	type: 'hand';
	raised: boolean;
	raisedAt?: number;
	/** A hand we are being told about again for our benefit, not one that has just gone up. */
	rebroadcast?: boolean;
};

export type ReactionMessage = { type: 'reaction'; emoji: string; reactionId?: string };

/** Everyone receives it; only its target, by identity, acts on it. */
export type MuteMessage = { type: 'mute'; target?: string };

export type CallDataMessage = HandMessage | ReactionMessage | MuteMessage;

/** Raise times by participant identity; 0 for a hand that is down. */
export type HandsMap = Record<string, number>;

export const encodeMessage = (message: CallDataMessage) => new TextEncoder().encode(JSON.stringify(message));

/** A message another client sent, or null for anything this client does not act on. */
export const parseMessage = (payload: Uint8Array): CallDataMessage | null => {
	let msg: unknown;
	try {
		msg = JSON.parse(new TextDecoder().decode(payload));
	} catch {
		return null;
	}
	if (typeof msg !== 'object' || msg === null) {
		return null;
	}
	const { type, raised, raisedAt, rebroadcast, emoji, reactionId, target } = msg as Record<string, unknown>;
	switch (type) {
		case 'hand':
			return {
				type,
				raised: raised === true,
				raisedAt: typeof raisedAt === 'number' ? raisedAt : undefined,
				rebroadcast: rebroadcast === true,
			};
		case 'mute':
			return { type, target: typeof target === 'string' ? target : undefined };
		case 'reaction':
			return emoji && typeof emoji === 'string'
				? { type, emoji, reactionId: typeof reactionId === 'string' ? reactionId : undefined }
				: null;
		default:
			return null;
	}
};

/** Whether a hand message is news worth a chime: on the way up, not a rebroadcast, and not already announced. */
export const isHandNews = (message: HandMessage, alreadyAnnounced: boolean): boolean =>
	message.raised && !message.rebroadcast && !alreadyAnnounced;

export const applyHand = (hands: HandsMap, identity: string, message: HandMessage, now: number): HandsMap => ({
	...hands,
	[identity]: message.raised ? message.raisedAt || now : 0,
});

export const dropHand = (hands: HandsMap, identity: string): HandsMap => {
	if (!(identity in hands)) return hands;
	const { [identity]: _drop, ...rest } = hands;
	return rest;
};

/** Every raised hand, oldest first: the index is the queue position. */
export const orderRaisedHands = (hands: HandsMap): { id: string; raisedAt: number }[] =>
	Object.entries(hands)
		.filter(([, raisedAt]) => raisedAt > 0)
		.map(([id, raisedAt]) => ({ id, raisedAt }))
		.sort((a, b) => a.raisedAt - b.raisedAt);

export const reactionIdFor = (identity: string, now: number) => `${identity}-${now}-${Math.random().toString(36).slice(2, 6)}`;

export const createReaction = (participantId: string, emoji: string, now: number, reactionId?: string): ActiveReaction => ({
	id: reactionId || reactionIdFor(participantId, now),
	participantId,
	emoji,
	sentAt: now,
	expiresAt: now + REACTION_TTL_MS,
});

/** The reactions still on screen at `now`; the same array when none has expired, so nothing re-renders for it. */
export const sweepReactions = (reactions: ActiveReaction[], now: number): ActiveReaction[] => {
	const next = reactions.filter((r) => r.expiresAt > now);
	return next.length === reactions.length ? reactions : next;
};

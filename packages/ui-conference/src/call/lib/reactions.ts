import type { ActiveReaction } from '../context';

/** How long a reaction is seen: rising over the call, and on its sender's tile, alike. */
export const REACTION_VISIBLE_MS = 3000;

/** What a sender's tile shows of their reactions. */
export type TileReaction = Pick<ActiveReaction, 'id' | 'emoji'>;

/** Each sender's latest reaction still on screen, by participant id: a newer one replaces any before it. */
export const latestReactionBySender = (reactions: ActiveReaction[]): Record<string, TileReaction> =>
	Object.fromEntries(reactions.map(({ participantId, id, emoji }) => [participantId, { id, emoji }]));

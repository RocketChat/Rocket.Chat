import { Emitter } from '@rocket.chat/emitter';

/**
 * The subscription store publishes here the subscriptions that the server reports as removed in a sync (the user left
 * the room while this client was closed or offline). The local search index listens, so the store does not import the
 * E2EE client.
 */
export const subscriptionRemovals = new Emitter<{ removed: { rid: string } }>();

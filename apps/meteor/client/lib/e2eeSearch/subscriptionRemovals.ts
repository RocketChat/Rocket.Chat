import { Emitter } from '@rocket.chat/emitter';

/** The subscriptions that a sync reported as removed, published so the store does not import the E2EE client. */
export const subscriptionRemovals = new Emitter<{ removed: { rid: string } }>();

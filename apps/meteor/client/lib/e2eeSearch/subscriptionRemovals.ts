import { Emitter } from '@rocket.chat/emitter';

/** Publish room membership removals received during synchronization. */
export const subscriptionRemovals = new Emitter<{ removed: { rid: string } }>();

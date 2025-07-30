import { CachedChatSubscription } from './CachedChatSubscription';

/** @deprecated prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Subscriptions = {
	use: CachedChatSubscription.store,
	get state() {
		return this.use.getState();
	},
} as const;

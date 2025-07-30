import { AuthzCachedCollection } from './AuthzCachedCollection';

/** @deprecated prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Permissions = {
	use: AuthzCachedCollection.store,
	get state() {
		return this.use.getState();
	},
} as const;

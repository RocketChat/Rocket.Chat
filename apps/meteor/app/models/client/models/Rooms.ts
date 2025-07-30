import { CachedChatRoom } from './CachedChatRoom';

/** @deprecated prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Rooms = {
	use: CachedChatRoom.store,
	get state() {
		return this.use.getState();
	},
} as const;

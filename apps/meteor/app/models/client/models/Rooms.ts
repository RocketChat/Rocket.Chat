import { CachedChatRoom } from './CachedChatRoom';

/** @deprecated new code refer to Minimongo collections like this one; prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Rooms = CachedChatRoom.collection;

import type { IRoom } from '@rocket.chat/core-typings';
import type { StoreApi, UseBoundStore } from 'zustand';

import { CachedChatRoom } from './CachedChatRoom';
import type { IDocumentMapStore } from '../../../../client/lib/cachedCollections/DocumentMapStore';

type RoomsStore = {
	use: UseBoundStore<StoreApi<IDocumentMapStore<IRoom>>>;
	readonly state: IDocumentMapStore<IRoom>;
};

/** @deprecated new code refer to Minimongo collections like this one; prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Rooms = CachedChatRoom.collection as RoomsStore;

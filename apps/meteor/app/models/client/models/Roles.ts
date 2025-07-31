import type { IRole } from '@rocket.chat/core-typings';

import { createDocumentMapStore } from '../../../../client/lib/cachedCollections/DocumentMapStore';

/** @deprecated prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Roles = {
	use: createDocumentMapStore<IRole>(),
	get state() {
		return Roles.use.getState();
	},
};

import type { IMessage } from '@rocket.chat/core-typings';

import { createDocumentMapStore } from '../../../../client/lib/cachedCollections';

/** @deprecated prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Messages = {
	use: createDocumentMapStore<IMessage & { ignored?: boolean; autoTranslateFetching?: boolean; autoTranslateShowInverse?: boolean }>(),
	get state() {
		return Messages.use.getState();
	},
};

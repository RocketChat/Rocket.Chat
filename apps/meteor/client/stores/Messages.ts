import type { IMessage } from '@rocket.chat/core-typings';

import { createDocumentMapStore } from '../lib/cachedStores/DocumentMapStore';
import { createGlobalStore } from '../lib/cachedStores/createGlobalStore';

export type MessageRecord = IMessage & {
	ignored?: boolean;
	autoTranslateFetching?: boolean;
	autoTranslateShowInverse?: boolean;
	temp?: boolean;
};

/** @deprecated prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Messages = createGlobalStore(createDocumentMapStore<MessageRecord>());

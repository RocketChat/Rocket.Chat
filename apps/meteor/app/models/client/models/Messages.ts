import type { IMessage } from '@rocket.chat/core-typings';

import { MinimongoCollection } from '../../../../client/lib/cachedCollections/MinimongoCollection';

/** @deprecated new code refer to Minimongo collections like this one; prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Messages = new MinimongoCollection<IMessage & { ignored?: boolean }>();

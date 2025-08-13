import type { ISetting } from '@rocket.chat/core-typings';

import { createDocumentMapStore, createGlobalStore } from '../lib/cachedStores';

export const PublicSettings = createGlobalStore(createDocumentMapStore<ISetting>());

export const PrivateSettings = createGlobalStore(createDocumentMapStore<ISetting>());

import type { ISetting } from '@rocket.chat/core-typings';

import { createDocumentMapStore } from '../lib/cachedStores/DocumentMapStore';
import { createGlobalStore } from '../lib/cachedStores/createGlobalStore';

export const PublicSettings = createGlobalStore(createDocumentMapStore<ISetting>());

export const PrivateSettings = createGlobalStore(createDocumentMapStore<ISetting>());

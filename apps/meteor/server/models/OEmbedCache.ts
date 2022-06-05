import { registerModel } from '@rocket.chat/models';
import type { IOEmbedCacheModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { OEmbedCacheRaw } from './raw/OEmbedCache';

const col = db.collection(`${prefix}oembed_cache`);
registerModel('IOEmbedCacheModel', new OEmbedCacheRaw(col, trashCollection) as IOEmbedCacheModel);

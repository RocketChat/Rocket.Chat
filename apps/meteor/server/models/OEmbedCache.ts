import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { OEmbedCacheRaw } from './raw/OEmbedCache';

const col = db.collection(`${prefix}oembed_cache`);
registerModel('IOEmbedCacheModel', new OEmbedCacheRaw(col, trashCollection));

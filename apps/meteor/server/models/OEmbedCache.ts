import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { OEmbedCacheRaw } from './raw/OEmbedCache';

registerModel('IOEmbedCacheModel', new OEmbedCacheRaw(db));

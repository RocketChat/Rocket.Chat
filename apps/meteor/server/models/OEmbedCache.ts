import { registerModel } from '@rocket.chat/models';

import { OEmbedCacheRaw } from './raw/OEmbedCache';

registerModel('IOEmbedCacheModel', new OEmbedCacheRaw());

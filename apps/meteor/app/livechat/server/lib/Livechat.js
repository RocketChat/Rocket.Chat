// Note: Please don't add any new methods to this file, since its still in js and we are migrating to ts
// Please add new methods to LivechatTyped.ts
import { Logger } from '@rocket.chat/logger';

import { Analytics } from './Analytics';

const logger = new Logger('Livechat');

export const Livechat = {
	Analytics,

	logger,
};

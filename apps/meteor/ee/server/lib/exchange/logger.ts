import { Logger } from '@rocket.chat/logger';

import { scrubForLog } from './scrub';

const base = new Logger('Exchange');

export const logger = {
	debug: (msg: object | string): void => base.debug(scrubForLog(msg) as object | string),
	info: (msg: object | string): void => base.info(scrubForLog(msg) as object | string),
	warn: (msg: object | string): void => base.warn(scrubForLog(msg) as object | string),
	error: (msg: object | string): void => base.error(scrubForLog(msg) as object | string),
};

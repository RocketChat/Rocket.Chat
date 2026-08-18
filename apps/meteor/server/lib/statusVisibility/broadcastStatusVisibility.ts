import { api } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';

const logger = new Logger('StatusVisibility');

export const broadcastStatusVisibility = (targets?: IUser['_id'][]): void => {
	void api
		.broadcast('presence.invalidateVisibility', { targets })
		.catch((err) => logger.error({ msg: 'Status visibility invalidation failed', err, targets }));
};

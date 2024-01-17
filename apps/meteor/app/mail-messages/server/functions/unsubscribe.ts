import { Users } from '@rocket.chat/models';

import { SystemLogger } from '../../../../server/lib/logger/system';

export const unsubscribe = async function (_id: string, createdAt: string): Promise<boolean> {
	if (_id && createdAt) {
		const affectedRows = (await Users.rocketMailUnsubscribe(_id, createdAt)) === 1;

		SystemLogger.debug('[Mailer:Unsubscribe]', _id, createdAt, new Date(parseInt(createdAt)), affectedRows);

		return affectedRows;
	}
	return false;
};

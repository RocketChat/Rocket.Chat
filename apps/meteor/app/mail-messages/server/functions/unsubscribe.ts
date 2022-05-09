import { Users } from '../../../models/server';
import { SystemLogger } from '../../../../server/lib/logger/system';

export const unsubscribe = function (_id: string, createdAt: string): boolean {
	if (_id && createdAt) {
		const affectedRows = Users.rocketMailUnsubscribe(_id, createdAt) === 1;

		SystemLogger.debug('[Mailer:Unsubscribe]', _id, createdAt, new Date(parseInt(createdAt)), affectedRows);

		return affectedRows;
	}
	return false;
};

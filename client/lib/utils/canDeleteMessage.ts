import { Meteor } from 'meteor/meteor';
import moment, { MomentInput } from 'moment';

import { hasPermission } from '../../../app/authorization/client';
import { settings } from '../../../app/settings/client';
import { IRoom } from '../../../definition/IRoom';
import { IUser } from '../../../definition/IUser';

export const canDeleteMessage = ({ rid, ts, uid }: { rid: IRoom['_id']; ts: MomentInput; uid: IUser['_id'] }): boolean => {
	const userId = Meteor.userId();

	const forceDelete = hasPermission('force-delete-message', rid);
	if (forceDelete) {
		return true;
	}

	const isDeleteAllowed: boolean | undefined = settings.get('Message_AllowDeleting');
	if (!isDeleteAllowed) {
		return false;
	}

	const allowed = hasPermission('delete-message', rid);

	const deleteOwn = allowed || (uid === userId && hasPermission('delete-own-message'));
	if (!allowed && !deleteOwn) {
		return false;
	}

	const blockDeleteInMinutes: number | undefined = settings.get('Message_AllowDeleting_BlockDeleteInMinutes');
	if (blockDeleteInMinutes && blockDeleteInMinutes !== 0) {
		if (!ts) {
			return false;
		}

		const msgTs = moment(ts);
		const now = moment();

		return now.diff(msgTs, 'minutes') < blockDeleteInMinutes;
	}

	return true;
};

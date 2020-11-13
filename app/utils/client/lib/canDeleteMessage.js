import { Meteor } from 'meteor/meteor';

import { getDateDiff, getDate } from '../../../../lib/rocketchat-dates';
import { hasPermission } from '../../../authorization/client';
import { settings } from '../../../settings/client';

export const canDeleteMessage = ({ rid, ts, uid }) => {
	const userId = Meteor.userId();

	const forceDelete = hasPermission('force-delete-message', rid);
	if (forceDelete) {
		return true;
	}

	const isDeleteAllowed = settings.get('Message_AllowDeleting');
	if (!isDeleteAllowed) {
		return false;
	}

	const allowed = hasPermission('delete-message', rid);

	const deleteOwn = allowed || (uid === userId && hasPermission('delete-own-message'));
	if (!allowed && !deleteOwn) {
		return false;
	}

	const blockDeleteInMinutes = settings.get('Message_AllowDeleting_BlockDeleteInMinutes');
	if (blockDeleteInMinutes != null && blockDeleteInMinutes !== 0) {
		let msgTs;
		if (ts != null) {
			msgTs = getDate(ts);
		}
		let currentTsDiff;
		if (msgTs != null) {
			currentTsDiff = getDateDiff(getDate(), msgTs, 'minutes');
		}
		return currentTsDiff < blockDeleteInMinutes;
	}

	return true;
};

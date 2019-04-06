import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import { hasAtLeastOnePermission } from '../../../authorization/client';
import { settings } from '../../../settings/client';

export const canDeleteMessage = ({ rid, ts, uid }) => {
	const userId = Meteor.userId();

	const forceDelete = hasAtLeastOnePermission('force-delete-message', rid);
	if (forceDelete) {
		return true;
	}

	const isDeleteAllowed = settings.get('Message_AllowDeleting');
	if (!isDeleteAllowed) {
		return false;
	}

	const hasPermission = hasAtLeastOnePermission('delete-message', rid);
	const deleteOwn = uid === userId;
	if (!hasPermission && !deleteOwn) {
		return false;
	}

	const blockDeleteInMinutes = settings.get('Message_AllowDeleting_BlockDeleteInMinutes');
	if (blockDeleteInMinutes != null && blockDeleteInMinutes !== 0) {
		let msgTs;
		if (ts != null) {
			msgTs = moment(ts);
		}
		let currentTsDiff;
		if (msgTs != null) {
			currentTsDiff = moment().diff(msgTs, 'minutes');
		}
		return currentTsDiff < blockDeleteInMinutes;
	}

	return true;
};



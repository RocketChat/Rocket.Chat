import { Template } from 'meteor/templating';

import { UserAction, USER_TYPING, USER_RECORDING, USER_UPLOADING } from '../../../ui';
import { t } from '../../../utils';
import { getConfig } from '../../../ui-utils/client/config';
import './userActionIndicator.html';

const maxUsernames = parseInt(getConfig('max-usernames-typing')) || 4;

const showUserActivity = (action, activity, rid) => {
	const users = UserAction.get(rid, activity);
	if (users.length === 0) {
		return;
	}
	if (users.length === 1) {
		return {
			action,
			multi: false,
			selfActivity: UserAction.selfActivity[activity],
			users: users[0],
		};
	}
	let last = users.pop();
	if (users.length >= maxUsernames) {
		last = t('others');
	}
	let usernames = users.slice(0, maxUsernames - 1).join(', ');
	usernames = [usernames, last];
	return {
		action,
		multi: true,
		selfActivity: UserAction.selfActivity[activity],
		users: usernames.join(` ${ t('and') } `),
	};
};

Template.userActionIndicator.helpers({

	typingUsersData() {
		return showUserActivity('typing', USER_TYPING, this.rid);
	},
	uploadingUsersData() {
		return showUserActivity('uploading', USER_UPLOADING, this.rid);
	},
	recordingUsersData() {
		return showUserActivity('recording', USER_RECORDING, this.rid);
	},
});

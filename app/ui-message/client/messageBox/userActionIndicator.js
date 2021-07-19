import { Template } from 'meteor/templating';

import { UserAction, USER_TYPING, USER_RECORDING, USER_UPLOADING } from '../../../ui';
import { t } from '../../../utils';
import { getConfig } from '../../../ui-utils/client/config';
import './userActionIndicator.html';

const maxUsernames = parseInt(getConfig('max-usernames-typing')) || 4;

const showUserActivity = (activity, id) => {
	const action = activity.split('-')[1];
	const users = UserAction.get(id, activity);

	if (users.length === 0) {
		return;
	}
	if (users.length === 1) {
		return {
			action,
			multi: false,
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
		users: usernames.join(` ${ t('and') } `),
	};
};

Template.userActionIndicator.helpers({
	typingUsersData() {
		return showUserActivity(USER_TYPING, this.tmid || this.rid);
	},
	uploadingUsersData() {
		return showUserActivity(USER_UPLOADING, this.tmid || this.rid);
	},
	recordingUsersData() {
		return showUserActivity(USER_RECORDING, this.tmid || this.rid);
	},
});

import { Template } from 'meteor/templating';
import _ from 'underscore';

import { UserAction } from '../../../ui';
import { t } from '../../../utils';
import { getConfig } from '../../../ui-utils/client/config';

import './userActionIndicator.html';

const maxUsernames = parseInt(getConfig('max-usernames-typing')) || 2;

Template.userActionIndicator.helpers({
	data() {
		const roomAction = UserAction.get(this.tmid || this.rid);
		if (_.isEmpty(roomAction)) {
			return [];
		}
		const activities = Object.keys(roomAction) || {};
		const userActions = activities.map((key) => {
			const action = key.split('-')[1];
			const users = Object.keys(roomAction[key]);
			if (users.length < 1) {
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
		}).filter((i) => i);
		if (_.isEmpty(userActions)) {
			return [];
		}
		// insert end=true for the last item.
		userActions[userActions.length - 1].end = true;
		return userActions;
	},
});

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
		const userActions = [];
		const activities = Object.keys(roomAction) || {};
		activities.forEach((key) => {
			const action = key.split('-')[1];
			const users = Object.keys(roomAction[key]);
			if (users.length < 1) {
				return;
			}
			if (users.length === 1) {
				userActions.push({
					action,
					multi: false,
					users: users[0],
				});
				return;
			}
			let last = users.pop();
			if (users.length >= maxUsernames) {
				last = t('others');
			}
			let usernames = users.slice(0, maxUsernames - 1).join(', ');
			usernames = [usernames, last];
			userActions.push({
				action,
				multi: true,
				users: usernames.join(` ${ t('and') } `),
			});
		});
		if (_.isEmpty(userActions)) {
			return [];
		}
		// insert end=true for the last item.
		userActions[userActions.length - 1].end = true;
		return userActions;
	},
});

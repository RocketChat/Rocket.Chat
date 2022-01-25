import { Template } from 'meteor/templating';

import { UserAction } from '../../../ui';
import { t } from '../../../utils/client';
import { getConfig } from '../../../../client/lib/utils/getConfig';

import './userActionIndicator.html';

const maxUsernames = parseInt(getConfig('max-usernames-typing') || '2');

Template.userActionIndicator.helpers({
	data() {
		const roomAction = UserAction.get(this.tmid || this.rid) || {};
		if (!Object.keys(roomAction).length) {
			return [];
		}

		const activities = Object.entries(roomAction);
		const userActions = activities
			.map(([key, _users]) => {
				const users = Object.keys(_users);
				if (users.length === 0) {
					return {
						end: false,
					};
				}

				const action = key.split('-')[1];
				if (users.length === 1) {
					return {
						action,
						multi: false,
						users: users[0],
						end: false,
					};
				}

				let last = users.pop();
				if (users.length >= maxUsernames) {
					last = t('others');
				}

				const usernames = [users.slice(0, maxUsernames - 1).join(', '), last];
				return {
					action,
					multi: true,
					users: usernames.join(` ${t('and')} `),
					end: false,
				};
			})
			.filter((i) => i.action);

		if (!Object.keys(userActions).length) {
			return [];
		}

		// insert end=true for the last item.
		userActions[userActions.length - 1].end = true;
		return userActions;
	},
});

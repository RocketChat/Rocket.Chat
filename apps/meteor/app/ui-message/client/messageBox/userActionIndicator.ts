import { Template } from 'meteor/templating';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

import { UserAction } from '../../../ui/client';
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
			.map(
				([key, _users]):
					| {
							action?: TranslationKey;
							users?: string;
							end: false | true;
					  }
					| undefined => {
					const users = Object.keys(_users);
					if (users.length === 0) {
						return {
							end: false,
						};
					}

					const action = key.split('-')[1];

					if (action !== 'typing' && action !== 'recording' && action !== 'uploading') {
						return undefined;
					}

					if (users.length === 1) {
						return {
							action: `is_${action}`,
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
						action: `are_${action}`,
						users: usernames.join(` ${t('and')} `),
						end: false,
					};
				},
			)
			.filter((i) => i && 'action' in i);

		if (!Object.keys(userActions).length) {
			return [];
		}

		// insert end=true for the last item.
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		userActions[userActions.length - 1]!.end = true;
		return userActions;
	},
});

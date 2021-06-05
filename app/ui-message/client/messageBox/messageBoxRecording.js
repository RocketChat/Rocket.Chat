import { Template } from 'meteor/templating';

import { MsgRecording } from '../../../ui';
import { t } from '../../../utils';
import { getConfig } from '../../../ui-utils/client/config';
import './messageBoxRecording.html';

const maxUsernames = parseInt(getConfig('max-usernames-typing')) || 4;
const activity = 'recording';

Template.messageBoxRecording.helpers({
	data() {
		const users = MsgRecording.get(this.rid);
		if (users.length === 0) {
			return;
		}
		if (users.length === 1) {
			return {
				activity,
				multi: false,
				selfActivity: MsgRecording.selfRecording,
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
			activity,
			multi: true,
			selfActivity: MsgRecording.selfRecording,
			users: usernames.join(` ${ t('and') } `),
		};
	},
});

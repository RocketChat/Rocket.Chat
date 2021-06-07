import { Template } from 'meteor/templating';

import { MsgUploading } from '../../../ui';
import { t } from '../../../utils';
import { getConfig } from '../../../ui-utils/client/config';
import './messageBoxUploading.html';

const maxUsernames = parseInt(getConfig('max-usernames-uploading')) || 4;
const activity = 'uploading';

Template.messageBoxUploading.helpers({
	data() {
		const users = MsgUploading.get(this.rid);
		if (users.length === 0) {
			return;
		}
		if (users.length === 1) {
			return {
				activity,
				multi: false,
				selfActivity: MsgUploading.selfUploading,
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
			selfActivity: MsgUploading.selfUploading,
			users: usernames.join(` ${ t('and') } `),
		};
	},
});

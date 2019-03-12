import { Template } from 'meteor/templating';
import { MsgTyping } from '/app/ui';
import { t } from '/app/utils';
import './messageBoxTyping.html';


Template.messageBoxTyping.helpers({
	data() {
		const maxUsernames = 4;
		const users = MsgTyping.get(this.rid);
		if (users.length === 0) {
			return;
		}
		if (users.length === 1) {
			return {
				multi: false,
				selfTyping: MsgTyping.selfTyping.get(),
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
			multi: true,
			selfTyping: MsgTyping.selfTyping.get(),
			users: usernames.join(` ${ t('and') } `),
		};
	},
});

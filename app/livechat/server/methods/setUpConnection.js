import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:setUpConnection'(data) {

		check(data, {
			token: String,
		});

		const { token } = data;

		this.connection.livechatToken = token;
		this.connection.onClose(() => {
			Livechat.notifyGuestStatusChanged(token, 'offline');
		});
	},
});

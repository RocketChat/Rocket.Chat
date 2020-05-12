import { Meteor } from 'meteor/meteor';

export function LennyFace(command, params, item) {
	if (command === 'lennyface') {
		const msg = item;
		msg.msg = `${ params } ( ͡° ͜ʖ ͡°)`;
		Meteor.call('sendMessage', msg);
	}
}

import { Meteor } from 'meteor/meteor';

export function Shrug(command, params, item) {
	if (command === 'shrug') {
		const msg = item;
		msg.msg = `${ params } ¯\\_(ツ)_/¯`;
		Meteor.call('sendMessage', msg);
	}
}

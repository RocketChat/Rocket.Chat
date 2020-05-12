import { Meteor } from 'meteor/meteor';

export function Unflip(command, params, item) {
	if (command === 'unflip') {
		const msg = item;
		msg.msg = `${ params } ┬─┬ ノ( ゜-゜ノ)`;
		Meteor.call('sendMessage', msg);
	}
}

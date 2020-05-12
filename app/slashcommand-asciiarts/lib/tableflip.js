import { Meteor } from 'meteor/meteor';

export function Tableflip(command, params, item) {
	if (command === 'tableflip') {
		const msg = item;
		msg.msg = `${ params } (╯°□°）╯︵ ┻━┻`;
		Meteor.call('sendMessage', msg);
	}
}

import { Meteor } from 'meteor/meteor';

export function Gimme(command, params, item) {
	if (command === 'gimme') {
		const msg = item;
		msg.msg = `༼ つ ◕_◕ ༽つ ${ params }`;
		Meteor.call('sendMessage', msg);
	}
}

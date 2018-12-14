import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

export default function handleQUIT(args) {
	const user = RocketChat.models.Users.findOne({
		'profile.irc.nick': args.nick,
	});

	Meteor.users.update({ _id: user._id }, {
		$set: {
			status: 'offline',
		},
	});

	RocketChat.models.Rooms.removeUsernameFromAll(user.username);
}

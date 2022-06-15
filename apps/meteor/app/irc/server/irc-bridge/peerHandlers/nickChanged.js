import { Users } from '../../../../models';

export default function handleNickChanged(args) {
	const user = Users.findOne({
		'profile.irc.nick': args.nick,
	});

	if (!user) {
		throw new Error(`Could not find an user with nick ${args.nick}`);
	}

	this.log(`${user.username} changed nick: ${args.nick} -> ${args.newNick}`);

	// Update on the database
	Users.update(
		{ _id: user._id },
		{
			$set: {
				'name': args.newNick,
				'profile.irc.nick': args.newNick,
			},
		},
	);
}

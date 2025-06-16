import { Users } from '@rocket.chat/models';

import { notifyOnUserChange } from '../../../../lib/server/lib/notifyListener';

export default async function handleNickChanged(args) {
	const user = await Users.findOne({
		'profile.irc.nick': args.nick,
	});

	if (!user) {
		throw new Error(`Could not find an user with nick ${args.nick}`);
	}

	this.log(`${user.username} changed nick: ${args.nick} -> ${args.newNick}`);

	// Update on the database
	await Users.updateOne(
		{ _id: user._id },
		{
			$set: {
				'name': args.newNick,
				'profile.irc.nick': args.newNick,
			},
		},
	);

	void notifyOnUserChange({ clientAction: 'updated', id: user._id, diff: { name: args.newNick } });
}

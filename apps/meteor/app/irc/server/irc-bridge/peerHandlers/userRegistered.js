import { Users } from '@rocket.chat/models';

import { notifyOnUserChange } from '../../../../lib/server/lib/notifyListener';

export default async function handleUserRegistered(args) {
	// Check if there is an user with the given username
	let user = await Users.findOne({
		'profile.irc.username': args.username,
	});

	// If there is no user, create one...
	if (!user) {
		this.log(`Registering ${args.username} with nick: ${args.nick}`);

		const userToInsert = {
			name: args.nick,
			username: `${args.username}-irc`,
			status: 'online',
			utcOffset: 0,
			active: true,
			type: 'user',
			profile: {
				irc: {
					fromIRC: true,
					nick: args.nick,
					username: args.username,
					hostname: args.hostname,
				},
			},
		};

		user = await Users.create(userToInsert);

		void notifyOnUserChange({ id: user._id, clientAction: 'inserted', data: user });
	} else {
		// ...otherwise, log the user in and update the information
		this.log(`Logging in ${args.username} with nick: ${args.nick}`);

		await Users.updateOne(
			{ _id: user._id },
			{
				$set: {
					'status': 'online',
					'profile.irc.nick': args.nick,
					'profile.irc.username': args.username,
					'profile.irc.hostname': args.hostname,
				},
			},
		);

		void notifyOnUserChange({ id: user._id, clientAction: 'updated', diff: { status: 'online' } });
	}
}

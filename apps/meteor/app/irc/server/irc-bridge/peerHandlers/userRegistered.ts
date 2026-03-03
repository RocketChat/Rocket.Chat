import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { notifyOnUserChange } from '../../../../lib/server/lib/notifyListener';

type UserRegisteredArgs = {
	username: string;
	nick: string;
	hostname: string;
};

export default async function handleUserRegistered(this: any, args: UserRegisteredArgs): Promise<void> {
	// Check if there is an user with the given username
	let user: IUser | null = await Users.findOne({
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

		const insertResult = await Users.create(userToInsert as any);
		user = await Users.findOne({ _id: insertResult.insertedId });

		if (user) {
			void notifyOnUserChange({ id: user._id, clientAction: 'inserted', data: user });
		}
	} else {
		// ...otherwise, log the user in and update the information
		this.log(`Logging in ${args.username} with nick: ${args.nick}`);

		await Users.updateOne(
			{ _id: user._id },
			{
				$set: {
					'status': UserStatus.ONLINE,
					'profile.irc.nick': args.nick,
					'profile.irc.username': args.username,
					'profile.irc.hostname': args.hostname,
				},
			},
		);

		void notifyOnUserChange({ id: user._id, clientAction: 'updated', diff: { status: 'online' } });
	}
}

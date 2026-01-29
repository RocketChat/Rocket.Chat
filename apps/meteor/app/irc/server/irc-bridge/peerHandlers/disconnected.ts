import { UserStatus } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { notifyOnUserChange } from '../../../../lib/server/lib/notifyListener';

type QuitArgs = {
	nick: string;
};

export default async function handleQUIT(args: QuitArgs): Promise<void> {
	const user = await Users.findOne({
		'profile.irc.nick': args.nick,
	});

	if (!user) {
		return;
	}

	await Users.updateOne(
		{ _id: user._id },
		{
			$set: {
				status: UserStatus.OFFLINE,
			},
		},
	);

	void notifyOnUserChange({ id: user._id, clientAction: 'updated', diff: { status: 'offline' } });
}

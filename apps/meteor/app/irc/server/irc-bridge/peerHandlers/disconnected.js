import { Users } from '@rocket.chat/models';

import { notifyOnUserChange } from '../../../../lib/server/lib/notifyListener';

export default async function handleQUIT(args) {
	const user = await Users.findOne({
		'profile.irc.nick': args.nick,
	});

	await Users.updateOne(
		{ _id: user._id },
		{
			$set: {
				status: 'offline',
			},
		},
	);

	void notifyOnUserChange({ id: user._id, clientAction: 'updated', diff: { status: 'offline' } });
}

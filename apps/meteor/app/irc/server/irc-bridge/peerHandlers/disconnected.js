import { Users } from '@rocket.chat/models';

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
}

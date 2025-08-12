import { Users } from '@rocket.chat/models';

export async function userLoggedOut(userId: string) {
	if (!userId) {
		return false;
	}

	const user = await Users.findOneById(userId);

	if (user?.services?.cloud) {
		await Users.updateOne(
			{ _id: user._id },
			{
				$unset: {
					'services.cloud': 1,
				},
			},
		);
	}

	return true;
}

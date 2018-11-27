import { Meteor } from 'meteor/meteor';

import { UsersSessionsRaw } from '../../../../presence/server/model';

const UsersRaw = Meteor.users.rawCollection();

export async function afterAll(ctx, res) {
	const { userId } = res;

	const userSession = await UsersSessionsRaw.findOne({ _id: userId });

	if (!userSession) {
		await UsersRaw.updateOne({ _id: userId }, {
			$set: {
				status: 'offline',
			},
		});
		return res;
	}

	const status = userSession.connections.reduce((current, { status }) => {
		if (status === 'online') {
			return 'online';
		}
		if (status !== 'offline') {
			return status;
		}
		return current;
	}, 'offline');

	await UsersRaw.updateOne({ _id: userId }, {
		$set: {
			status,
		},
	});

	return res;
}

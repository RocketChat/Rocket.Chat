import { Users } from '@rocket.chat/models';

import { addUserToDefaultChannels } from './addUserToDefaultChannels';

export const joinDefaultChannels = async (userId: string, silenced?: boolean): Promise<void> => {
	const user = await Users.findOneById(userId);

	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user');
	}
	return addUserToDefaultChannels(user, Boolean(silenced));
};

import { IUser } from '@rocket.chat/core-typings';

import { Users } from '../../../models/server';

export const normalize = async (userId: string): Promise<IUser> => {
	// Normalize the user
	return Users.findOneById(userId);
};

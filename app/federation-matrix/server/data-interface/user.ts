import { IUser } from '../../../../definition/IUser';
import { Users } from '../../../models/server';

export const normalize = async (userId: string): Promise<IUser> => {
	// Normalize the user
	return Users.findOneById(userId);
};

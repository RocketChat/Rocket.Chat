import { Users } from '@rocket.chat/models';

export const checkEmailAvailability = async function (email: string): Promise<boolean> {
	return !(await Users.findOneByEmailAddress(email));
};

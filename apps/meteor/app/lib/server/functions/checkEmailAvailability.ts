import { Users } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';

export const checkEmailAvailability = async function (email: string): Promise<boolean> {
	return !(await Users.findOneByEmailAddress(email));
};

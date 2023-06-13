import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Users } from '@rocket.chat/models';

export const checkEmailAvailability = async function (email: string): Promise<boolean> {
	return !(await Users.findOne({
		'emails.address': { $regex: new RegExp(`^${escapeRegExp(email).trim()}$`, 'i') },
	}));
};

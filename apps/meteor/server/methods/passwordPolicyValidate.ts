import { PasswordPolicyError } from '@rocket.chat/account-utils';
import { MeteorError } from '@rocket.chat/core-services';

import { passwordPolicy } from '../../app/lib/server';

export const passwordPolicyValidate = (password: string) => {
	try {
		passwordPolicy.validate(password);
	} catch (err) {
		if (err instanceof PasswordPolicyError) {
			throw new MeteorError(err.error, err.message, err.reasons);
		}
		throw err;
	}
};

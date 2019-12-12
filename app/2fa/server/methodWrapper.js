import { Users } from '../../models';
import { checkCodeForUser } from './code';

export function require2fa(fn) {
	return function(...args) {
		if (!this.twoFactorChecked) {
			const user = Users.findOneById(this.userId);
			checkCodeForUser(user);
		}

		return fn.apply(this, args);
	};
}

import { checkCodeForUser } from './code/index.ts';

export function require2fa(fn) {
	return function(...args) {
		if (!this.twoFactorChecked) {
			checkCodeForUser(this.userId);
		}

		return fn.apply(this, args);
	};
}

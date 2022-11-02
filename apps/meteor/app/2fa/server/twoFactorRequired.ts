import { Meteor } from 'meteor/meteor';

import type { ITwoFactorOptions } from './code/index';
import { checkCodeForUser } from './code/index';

export function twoFactorRequired<TFunction extends (this: Meteor.MethodThisType, ...args: any[]) => any>(
	fn: TFunction,
	options?: ITwoFactorOptions,
): (this: Meteor.MethodThisType, ...args: Parameters<TFunction>) => ReturnType<TFunction> {
	return function (this: Meteor.MethodThisType, ...args: Parameters<TFunction>): ReturnType<TFunction> {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'twoFactorRequired' });
		}

		// get two factor options from last item of args and remove it
		const twoFactor = args.pop();
		if (twoFactor) {
			if (twoFactor.twoFactorCode && twoFactor.twoFactorMethod) {
				checkCodeForUser({
					user: this.userId,
					connection: this.connection || undefined,
					code: twoFactor.twoFactorCode,
					method: twoFactor.twoFactorMethod,
					options,
				});
				this.twoFactorChecked = true;
			} else {
				// if it was not two factor options, put it back
				args.push(twoFactor);
			}
		}

		if (!this.twoFactorChecked) {
			checkCodeForUser({ user: this.userId, connection: this.connection || undefined, options });
		}

		return fn.apply(this, args);
	};
}

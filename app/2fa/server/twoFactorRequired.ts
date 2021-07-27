import { Meteor } from 'meteor/meteor';

import { checkCodeForUser, ITwoFactorOptions } from './code/index';
import { IMethodThisType } from '../../../definition/IMethodThisType';

export function twoFactorRequired(fn: Function, options: ITwoFactorOptions): Function {
	return function(this: IMethodThisType, ...args: any[]): any {
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

import { Meteor } from 'meteor/meteor';

import type { ITwoFactorOptions } from './code/index';
import { checkCodeForUser } from './code/index';

export const twoFactorRequired = <TFunction extends (this: any, ...args: any) => any>(
	fn: ThisParameterType<TFunction> extends Meteor.MethodThisType
		? TFunction
		: (this: Meteor.MethodThisType, ...args: Parameters<TFunction>) => ReturnType<TFunction>,
	options?: ITwoFactorOptions,
) =>
	async function (this, ...args) {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'twoFactorRequired' });
		}

		// get two factor options from last item of args and remove it
		const twoFactor = args.pop();
		if (twoFactor) {
			if (twoFactor.twoFactorCode && twoFactor.twoFactorMethod) {
				await checkCodeForUser({
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
			await checkCodeForUser({ user: this.userId, connection: this.connection || undefined, options });
		}

		return fn.apply(this, args);
	} as (this: ThisParameterType<TFunction>, ...args: Parameters<TFunction>) => ReturnType<TFunction>;

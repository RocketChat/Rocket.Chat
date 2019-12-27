import { Meteor } from 'meteor/meteor';

import { checkCodeForUser, ITwoFactorOptions } from './code/index';
import { IMethodThisType } from '../../../definition/IMethodThisType';
import { IMethodType } from '../../../definition/IMethodType';

export function twoFactorRequired(fn: Function, options: ITwoFactorOptions) {
	return function(this: IMethodThisType, ...args: any[]): any {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'twoFactorRequired' });
		}

		if (!this.twoFactorChecked) {
			checkCodeForUser({ user: this.userId, options, connection: this.connection || undefined });
		}

		return fn.apply(this, args);
	};
}

export const methodOptions: {[key: string]: ITwoFactorOptions} = {};

export function methodsWithTwoFactor(methods: IMethodType, options: ITwoFactorOptions): void {
	for (const [methodName, method] of Object.entries(methods)) {
		methods[methodName] = twoFactorRequired(method, options);
		methodOptions[methodName] = options;
	}

	return Meteor.methods(methods);
}

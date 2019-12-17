import { Meteor } from 'meteor/meteor';

import { checkCodeForUser } from './code/index';
import { IMethodThisType } from '../../../definition/IMethodThisType';
import { IMethodType } from '../../../definition/IMethodType';

export function twoFactorRequired(fn: Function) {
	return function(this: IMethodThisType, ...args: any[]): any {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'twoFactorRequired' });
		}

		if (!this.twoFactorChecked) {
			checkCodeForUser({ user: this.userId });
		}

		return fn.apply(this, args);
	};
}

export function methodsWithTwoFactor(methods: IMethodType): void {
	for (const [methodName, method] of Object.entries(methods)) {
		methods[methodName] = twoFactorRequired(method);
	}

	return Meteor.methods(methods);
}

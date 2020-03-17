import { Meteor } from 'meteor/meteor';

import { checkCodeForUser } from './code/index';
import { IMethodThisType } from '../../../definition/IMethodThisType';

export function twoFactorRequired(fn: Function): Function {
	return function(this: IMethodThisType, ...args: any[]): any {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'twoFactorRequired' });
		}

		if (!this.twoFactorChecked) {
			checkCodeForUser({ user: this.userId, connection: this.connection || undefined });
		}

		return fn.apply(this, args);
	};
}

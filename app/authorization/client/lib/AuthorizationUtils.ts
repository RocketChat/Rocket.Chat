import { Meteor } from 'meteor/meteor';

export const AuthorizationUtils = class {
	static isRoleReadOnly(roleId: string): boolean {
		if (!roleId) {
			throw new Meteor.Error('invalid-param');
		}
		return false;
	}
};

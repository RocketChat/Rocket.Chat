/* eslint-env mocha */
import 'babel-polyfill';
import assert from 'assert';
import { mapRolesFromSSO } from '../lib/oauth_helpers';

// base data set
let existingUser = {};
let userDB = [
]
// mock
global.RocketChat = {
	authz : {
		removeUserFromRoles(userId, role) {
			const user = userDB[userId];
			const foundIndex = user.roles.indexOf(role);
			if (foundIndex > - 1) {
				user.roles.splice(foundIndex, 1);
			}
		},
		addUserRoles(userId, role) {
			const user = userDB[userId];
			const foundIndex = user.roles.indexOf(role);
			if (foundIndex === - 1) {
				user.roles.push(role);
			}
		}
	}
};

describe('CustomOAuth - Server', () => {
	describe('Lib', () => {
		it('should add roles from SSO to existing user', () => {
			existingUser = { _id: 0, roles : ['userRole1'] };
			userDB = [
				existingUser
			];
			const ssoIdentity = { roles : ['userRole1', 'userRole2'] };
			mapRolesFromSSO(existingUser, ssoIdentity);
			const updatedUser = userDB[existingUser._id];
			assert.notEqual(updatedUser, null);
			assert.equal(updatedUser.roles[0], 'userRole1');
			assert.equal(updatedUser.roles[1], 'userRole2');
		});
		it('should remove roles from SSO on existing user', () => {
			existingUser = { _id: 0, roles : ['userRole1'] };
			userDB = [
				existingUser
			];
			const ssoIdentity = { roles : [] };
			mapRolesFromSSO(existingUser, ssoIdentity);
			const updatedUser = userDB[existingUser._id];
			assert.notEqual(updatedUser, null);
			assert.equal(updatedUser.roles.length, 0);
		});
	});
});

import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { overrideLoginMethod, type LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { AuthenticationResponseJSON } from '@simplewebauthn/server';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithPasskey(
			id: string,
			authenticationResponse: AuthenticationResponseJSON,
		): void;
	}
}

Meteor.loginWithPasskey = (
	id: string,
	authenticationResponse: AuthenticationResponseJSON,
) => {
	Accounts.callLoginMethod({
		methodArguments: [{
			'id': id,
			'authenticationResponse': authenticationResponse,
		}],
		userCallback(error) {
			if (error) {
				throw new Meteor.Error(error)
			}
		},
	});
};

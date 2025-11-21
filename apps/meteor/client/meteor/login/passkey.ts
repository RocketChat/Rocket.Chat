import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithPasskey(id: string, authenticationResponse: AuthenticationResponseJSON): void;
	}
}

Meteor.loginWithPasskey = (id: string, authenticationResponse: AuthenticationResponseJSON) => {
	Accounts.callLoginMethod({
		methodArguments: [
			{
				id,
				authenticationResponse,
			},
		],
		userCallback(error) {
			if (error) {
				throw new Meteor.Error(error);
			}
		},
	});
};

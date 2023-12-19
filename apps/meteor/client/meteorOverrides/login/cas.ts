import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import type { LoginCallback } from '../../lib/2fa/overrideLoginMethod';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithCas(_?: unknown, callback?: LoginCallback): void;
	}
}

Meteor.loginWithCas = (_, callback) => {
	const credentialToken = Random.id();
	import('../../lib/openCASLoginPopup')
		.then(({ openCASLoginPopup }) => openCASLoginPopup(credentialToken))
		.then(() => {
			// check auth on server.
			Accounts.callLoginMethod({
				methodArguments: [{ cas: { credentialToken } }],
				userCallback: callback,
			});
		})
		.catch((error) => {
			callback?.(error);
		});
};

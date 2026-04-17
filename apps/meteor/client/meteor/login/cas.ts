import { Random } from '@rocket.chat/random';
import { Meteor } from 'meteor/meteor';

import { callLoginMethod } from '../../lib/2fa/overrideLoginMethod';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithCas(_?: unknown, callback?: (err?: any) => void): void;
	}
}

Meteor.loginWithCas = (_, callback) => {
	const credentialToken = Random.id();
	import('../../lib/openCASLoginPopup')
		.then(({ openCASLoginPopup }) => openCASLoginPopup(credentialToken))
		.then(() => callLoginMethod({ methodArguments: [{ cas: { credentialToken } }] }))
		.then(() => callback?.())
		.catch(callback);
};

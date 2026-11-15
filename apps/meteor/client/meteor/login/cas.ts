import { Random } from '@rocket.chat/random';

import { callLoginMethod, registerLoginWithMethod } from '../accounts';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithCas(_?: unknown, callback?: (err?: any) => void): void;
	}
}

registerLoginWithMethod('loginWithCas', (_?: unknown, callback?: (err?: any) => void) => {
	const credentialToken = Random.id();
	import('../../lib/openCASLoginPopup')
		.then(({ openCASLoginPopup }) => openCASLoginPopup(credentialToken))
		.then(() => callLoginMethod({ methodArguments: [{ cas: { credentialToken } }] }))
		.then(() => callback?.())
		.catch(callback);
});

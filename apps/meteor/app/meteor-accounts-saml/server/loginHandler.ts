import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { i18n } from '../../../server/lib/i18n';
import { SystemLogger } from '../../../server/lib/logger/system';
import { SAML } from './lib/SAML';
import { SAMLUtils } from './lib/Utils';

const makeError = (message: string): Record<string, any> => ({
	type: 'saml',
	error: new Meteor.Error(Accounts.LoginCancelledError.numericError, message),
});

Accounts.registerLoginHandler('saml', async (loginRequest) => {
	if (!loginRequest.saml || !loginRequest.credentialToken || typeof loginRequest.credentialToken !== 'string') {
		return undefined;
	}

	const loginResult = await SAML.retrieveCredential(loginRequest.credentialToken);
	SAMLUtils.log({ msg: 'RESULT', loginResult });

	if (!loginResult) {
		return makeError('No matching login attempt found');
	}

	if (!loginResult.profile) {
		return makeError('No profile information found');
	}

	try {
		const userObject = SAMLUtils.mapProfileToUserObject(loginResult.profile);
		const updatedUser = await SAML.insertOrUpdateSAMLUser(userObject);
		SAMLUtils.events.emit('updateCustomFields', loginResult, updatedUser);

		return updatedUser;
	} catch (error: any) {
		SystemLogger.error(error);

		let message = error.toString();
		let errorCode = '';

		if (error instanceof Meteor.Error) {
			errorCode = (error.error || error.message) as string;
		} else if (error instanceof Error) {
			errorCode = error.message;
		}

		if (errorCode) {
			const localizedMessage = i18n.t(errorCode);
			if (localizedMessage && localizedMessage !== errorCode) {
				message = localizedMessage;
			}
		}

		return makeError(message);
	}
});

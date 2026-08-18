import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { i18n } from '../i18n';
import { SAML } from './lib/SAML';
import { SAMLUtils } from './lib/Utils';
import { SystemLogger } from '../logger/system';
import { warnUnlicensedAuthService } from '../premiumAuthDeprecation';

const makeError = (message: string): Record<string, any> => ({
	type: 'saml',
	error: new Meteor.Error(Accounts.LoginCancelledError.numericError, message),
});

Accounts.registerLoginHandler('saml', async (loginRequest) => {
	if (
		!loginRequest.saml ||
		!loginRequest.credentialToken ||
		typeof loginRequest.credentialToken !== 'string' ||
		SAMLUtils.serviceProviders.length === 0
	) {
		return undefined;
	}

	warnUnlicensedAuthService('SAML', 'saml-enterprise');

	const loginResult = await SAML.retrieveCredential(loginRequest.credentialToken);

	// Do not delete the credential token on redemption: the mobile login flow makes the webview
	// and the native app redeem the same token concurrently, so removing it after the first
	// redemption makes the second one fail with "No matching login attempt found".
	// The credential_tokens collection cleans these up via its TTL index on `expireAt`.
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
	} catch (err: any) {
		SystemLogger.error({ err });

		let message = err.toString();
		let errorCode = '';

		if (err instanceof Meteor.Error) {
			errorCode = (err.error || err.message) as string;
		} else if (err instanceof Error) {
			errorCode = err.message;
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

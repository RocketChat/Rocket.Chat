import { CredentialTokens, Users } from '@rocket.chat/models';
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

		// Store the credential token on the user so the 2FA callback can clean it up
		// after verification. This prevents the token from being deleted before the
		// second method.callAnon/login call (which carries the TOTP code) arrives.
		await Users.updateOne(
			{ _id: updatedUser.userId },
			{
				$set: {
					'services.saml.pendingCredentialToken': loginRequest.credentialToken,
					'services.saml.pendingCredentialExpiresAt': new Date(Date.now() + 300000),
				},
			},
		);

		return updatedUser;
	} catch (err: any) {
		// Clean up the credential on error since the 2FA callback won't run
		await CredentialTokens.removeById(loginRequest.credentialToken);
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

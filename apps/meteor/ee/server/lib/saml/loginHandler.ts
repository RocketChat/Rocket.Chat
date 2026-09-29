import { License } from '@rocket.chat/license';
import { CredentialTokens } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { getUserForCheck } from '../../../../server/lib/2fa/code';
import { i18n } from '../../../../server/lib/i18n';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { doesUserRequire2FA } from '../../../../server/lib/oauth/twoFactorAuth';
import { SAML } from './lib/SAML';
import { SAMLUtils } from './lib/Utils';

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

	// providers are only loaded while the module is licensed, this covers the
	// window between a license being removed and the providers being reloaded
	if (!License.hasModule('saml-enterprise')) {
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

		const user = await getUserForCheck(updatedUser.userId);

		if (!user || !doesUserRequire2FA(user)) {
			await CredentialTokens.removeById(loginRequest.credentialToken);
		}

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

		await CredentialTokens.removeById(loginRequest.credentialToken);

		return makeError(message);
	}
});

import { CredentialTokens, Users } from '@rocket.chat/models';
import { getObjectKeys } from '@rocket.chat/tools';
import { Accounts } from 'meteor/accounts-base';

import { _setRealName } from '../../../app/lib/server/functions/setRealName';
import { settings } from '../../../app/settings/server';
import { createNewUser } from './createNewUser';
import { findExistingCASUser } from './findExistingCASUser';
import { logger } from './logger';

export const loginHandlerCAS = async (options: any): Promise<undefined | Accounts.LoginMethodResult> => {
	if (!options.cas) {
		return undefined;
	}

	// TODO: Sync wrapper due to the chain conversion to async models
	const credentials = await CredentialTokens.findOneNotExpiredById(options.cas.credentialToken);
	if (credentials === undefined || credentials === null) {
		throw new Meteor.Error(Accounts.LoginCancelledError.numericError, 'no matching login attempt found');
	}

	const result = credentials.userInfo;
	const syncUserDataFieldMap = settings.get<string>('CAS_Sync_User_Data_FieldMap').trim();
	const casVersion = parseFloat(settings.get('CAS_version') ?? '1.0');
	const syncEnabled = settings.get('CAS_Sync_User_Data_Enabled');
	const flagEmailAsVerified = settings.get<boolean>('Accounts_Verify_Email_For_External_Accounts');
	const userCreationEnabled = settings.get('CAS_Creation_User_Enabled');

	const { username, attributes: credentialsAttributes } = result as { username: string; attributes: Record<string, string[]> };

	// We have these
	const externalAttributes: Record<string, string> = {
		username,
	};

	// We need these
	const internalAttributes: Record<string, string | undefined> = {
		email: undefined,
		name: undefined,
		username: undefined,
		rooms: undefined,
	};

	// Import response attributes
	if (casVersion >= 2.0) {
		// Clean & import external attributes
		for await (const [externalName, value] of Object.entries(credentialsAttributes)) {
			if (value) {
				externalAttributes[externalName] = value[0];
			}
		}
	}

	// Source internal attributes
	if (syncUserDataFieldMap) {
		// Our mapping table: key(int_attr) -> value(ext_attr)
		// Spoken: Source this internal attribute from these external attributes
		const attributeMap = JSON.parse(syncUserDataFieldMap) as Record<string, any>;

		for await (const [internalName, source] of Object.entries(attributeMap)) {
			if (!source || typeof source.valueOf() !== 'string') {
				continue;
			}

			let replacedValue = source as string;
			for await (const externalName of getObjectKeys(externalAttributes)) {
				replacedValue = replacedValue.replace(`%${externalName}%`, externalAttributes[externalName]);
			}

			if (source !== replacedValue) {
				internalAttributes[internalName] = replacedValue;
				logger.debug(`Sourced internal attribute: ${internalName} = ${replacedValue}`);
			} else {
				logger.debug(`Sourced internal attribute: ${internalName} skipped.`);
			}
		}
	}

	// Search existing user by its external service id
	logger.debug(`Looking up user by id: ${username}`);
	// First, look for a user that has logged in from CAS with this username before
	const user = await findExistingCASUser(username);

	if (user) {
		logger.debug(`Using existing user for '${username}' with id: ${user._id}`);
		if (syncEnabled) {
			logger.debug('Syncing user attributes');
			// Update name
			if (internalAttributes.name) {
				await _setRealName(user._id, internalAttributes.name);
			}

			// Update email
			if (internalAttributes.email) {
				await Users.updateOne(
					{ _id: user._id },
					{ $set: { emails: [{ address: internalAttributes.email, verified: flagEmailAsVerified }] } },
				);
			}
		}

		return { userId: user._id };
	}

	if (!userCreationEnabled) {
		// Should fail as no user exist and can't be created
		logger.debug(`User "${username}" does not exist yet, will fail as no user creation is enabled`);
		throw new Meteor.Error(Accounts.LoginCancelledError.numericError, 'no matching user account found');
	}

	const newUser = await createNewUser(username, {
		attributes: internalAttributes,
		casVersion,
		flagEmailAsVerified,
	});

	return { userId: newUser._id };
};

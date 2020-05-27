import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings } from '../../settings/server';
import { generateUsernameSuggestion } from '../../lib';
import { _setUsername } from '../../lib/server/functions';
import { SAMLUtils } from './lib/Utils';
import { SAML } from './lib/SAML';

Accounts.registerLoginHandler(function(loginRequest) {
	if (!loginRequest.saml || !loginRequest.credentialToken) {
		return undefined;
	}

	const loginResult = SAML.retrieveCredential(loginRequest.credentialToken);
	SAMLUtils.log(`RESULT :${ JSON.stringify(loginResult) }`);

	if (loginResult === undefined) {
		return {
			type: 'saml',
			error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'No matching login attempt found'),
		};
	}
	const { emailField, usernameField, nameField, userDataFieldMap, regexes } = SAMLUtils.getUserDataMapping();
	const { defaultUserRole = 'user', roleAttributeName, roleAttributeSync, generateUsername, immutableProperty } = SAMLUtils.globalSettings;

	if (loginResult && loginResult.profile && loginResult.profile[emailField]) {
		try {
			const emailList = Array.isArray(loginResult.profile[emailField]) ? loginResult.profile[emailField] : [loginResult.profile[emailField]];
			const emailRegex = new RegExp(emailList.map((email) => `^${ RegExp.escape(email) }$`).join('|'), 'i');

			const eduPersonPrincipalName = loginResult.profile.eppn;
			const profileFullName = SAMLUtils.getProfileValue(loginResult.profile, nameField, regexes.name);
			const fullName = profileFullName || loginResult.profile.displayName || loginResult.profile.username;

			let eppnMatch = false;
			let user = null;

			// Check eppn
			if (eduPersonPrincipalName) {
				user = Meteor.users.findOne({
					eppn: eduPersonPrincipalName,
				});

				if (user) {
					eppnMatch = true;
				}
			}

			let username;
			if (loginResult.profile[usernameField]) {
				const profileUsername = SAMLUtils.getProfileValue(loginResult.profile, usernameField, regexes.username);
				if (profileUsername) {
					username = SAML.normalizeUsername(profileUsername);
				}
			}

			// If eppn is not exist
			if (!user) {
				user = SAML.findUser(username, emailRegex);
			}

			const emails = emailList.map((email) => ({
				address: email,
				verified: settings.get('Accounts_Verify_Email_For_External_Accounts'),
			}));

			let globalRoles;
			if (roleAttributeName && loginResult.profile[roleAttributeName]) {
				globalRoles = [].concat(loginResult.profile[roleAttributeName]);
			} else {
				globalRoles = [].concat(defaultUserRole.split(','));
			}

			if (!user) {
				const newUser = {
					name: fullName,
					active: true,
					eppn: eduPersonPrincipalName,
					globalRoles,
					emails,
					services: {},
				};

				if (generateUsername === true) {
					username = generateUsernameSuggestion(newUser);
				}

				if (username) {
					newUser.username = username;
					newUser.name = newUser.name || SAML.guessNameFromUsername(username);
				}

				const languages = TAPi18n.getLanguages();
				if (languages[loginResult.profile.language]) {
					newUser.language = loginResult.profile.language;
				}

				const userId = Accounts.insertUserDoc({}, newUser);
				user = Meteor.users.findOne(userId);

				if (loginResult.profile.channels) {
					const channels = loginResult.profile.channels.split(',');
					SAML.subscribeToSAMLChannels(channels, user);
				}
			}

			// If eppn is not exist then update
			if (eppnMatch === false) {
				Meteor.users.update({
					_id: user._id,
				}, {
					$set: {
						eppn: eduPersonPrincipalName,
					},
				});
			}

			// creating the token and adding to the user
			const stampedToken = Accounts._generateStampedLoginToken();
			Meteor.users.update(user, {
				$push: {
					'services.resume.loginTokens': stampedToken,
				},
			});

			const samlLogin = {
				provider: SAMLUtils.relayState,
				idp: loginResult.profile.issuer,
				idpSession: loginResult.profile.sessionIndex,
				nameID: loginResult.profile.nameID,
			};

			const updateData = {
				// TBD this should be pushed, otherwise we're only able to SSO into a single IDP at a time
				'services.saml': samlLogin,
			};

			for (const field in userDataFieldMap) {
				if (!userDataFieldMap.hasOwnProperty(field)) {
					continue;
				}

				if (loginResult.profile[field]) {
					const rcField = userDataFieldMap[field];
					const value = SAMLUtils.getProfileValue(loginResult.profile, field, regexes[rcField]);
					updateData[`customFields.${ rcField }`] = value;
				}
			}

			if (immutableProperty !== 'EMail') {
				updateData.emails = emails;
			}

			if (roleAttributeSync) {
				updateData.roles = globalRoles;
			}

			Meteor.users.update({
				_id: user._id,
			}, {
				$set: updateData,
			});

			if (username) {
				_setUsername(user._id, username);
			}

			SAML.overwriteData(user, fullName, eppnMatch, emailList);

			// sending token along with the userId
			const result = {
				userId: user._id,
				token: stampedToken.token,
			};

			return result;
		} catch (error) {
			console.error(error);
			return {
				type: 'saml',
				error,
			};
		}
	}
	throw new Error('SAML Profile did not contain an email address');
});

import limax from 'limax';
import { SHA256 } from 'meteor/sha';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import ldapEscape from 'ldap-escape';
import _ from 'underscore';

import { ILDAPEntry } from '../../../definition/ldap/ILDAPEntry';
import { LDAPLoginResult } from '../../../definition/ldap/ILDAPLoginResult';
import { ILDAPUniqueIdentifierField } from '../../../definition/ldap/ILDAPUniqueIdentifierField';
import { IUser, /* IUserEmail,*/ LoginUsername } from '../../../definition/IUser';
import { IImportUser } from '../../../app/importer/server/definitions/IImportUser';
import { settings } from '../../../app/settings/server';
import { Users } from '../../../app/models/server';
import { LDAPConnection } from './Connection';
import { LDAPDataConverter } from './DataConverter';
import { getLDAPConditionalSetting } from './getLDAPConditionalSetting';
import { logger, authLogger, connLogger } from './Logger';
import type { IConverterOptions } from '../../../app/importer/server/classes/ImportDataConverter';
import { callbacks } from '../../../app/callbacks/server';

export class LDAPManager {
	public static async login(username: string, password: string): Promise<LDAPLoginResult> {
		logger.log({ msg: 'Init LDAP login', username });

		if (settings.get('LDAP_Enable') !== true) {
			return this.fallbackToDefaultLogin(username, password);
		}

		const ldap = this.getNewConnection();
		let ldapUser: ILDAPEntry | undefined;
		try {
			await ldap.connect();
			ldapUser = await this.findUser(ldap, username, password);
		} catch (error) {
			logger.error(error);
		}

		if (ldapUser === undefined) {
			return this.fallbackToDefaultLogin(username, password);
		}

		const slugifiedUsername = this.slugifyUsername(ldapUser, username);
		const user = this.findExistingUser(ldapUser, slugifiedUsername);

		if (user) {
			return this.loginExistingUser(ldap, user, ldapUser, password);
		}

		return this.loginNewUserFromLDAP(slugifiedUsername, password, ldapUser, ldap);
	}

	public static getNewConnection(): LDAPConnection {
		const ClassRef = callbacks.run('getLDAPConnectionClass') || LDAPConnection;

		return new ClassRef();
	}

	// This method will only find existing users that are already linked to LDAP
	protected static findExistingLDAPUser(ldapUser: ILDAPEntry): IUser | undefined {
		const uniqueIdentifierField = this.getLdapUserUniqueID(ldapUser);

		if (uniqueIdentifierField) {
			logger.info({ msg: 'Querying user', uniqueId: uniqueIdentifierField.value });
			return Users.findOneByLDAPId(uniqueIdentifierField.value, uniqueIdentifierField.attribute);
		}
	}

	protected static getConverterOptions(): IConverterOptions {
		return {
			flagEmailsAsVerified: settings.getAs<boolean>('Accounts_Verify_Email_For_External_Accounts'),
		};
	}

	protected static mapUserData(ldapUser: ILDAPEntry, usedUsername?: string | undefined): IImportUser {
		const uniqueId = this.getLdapUserUniqueID(ldapUser);
		if (!uniqueId) {
			throw new Error('Failed to generate unique identifier for ldap entry');
		}

		const { attribute: idAttribute, value: id } = uniqueId;
		const username = this.getLdapUsername(ldapUser) || usedUsername || id || undefined;
		const emails = this.getLdapEmails(ldapUser, username);
		const name = this.getLdapName(ldapUser) || undefined;

		const userData: IImportUser = {
			type: 'user',
			emails,
			importIds: [ldapUser.dn],
			username,
			name,
			services: {
				ldap: {
					idAttribute,
					id,
				},
			},
		};

		this.onMapUserData(ldapUser, userData);
		return userData;
	}

	private static onMapUserData(ldapUser: ILDAPEntry, userData: IImportUser): void {
		callbacks.run('mapLDAPUserData', userData, ldapUser);
	}

	private static async findUser(ldap: LDAPConnection, username: string, password: string): Promise<ILDAPEntry | undefined> {
		const escapedUsername = ldapEscape.filter`${ username }`;

		try {
			const users = await ldap.searchByUsername(escapedUsername);

			if (users.length !== 1) {
				logger.info(`Search returned ${ users.length } records for ${ escapedUsername }`);
				throw new Error('User not found');
			}

			const ldapUser = users[0];
			if (!await ldap.authenticate(ldapUser.dn, password)) {
				logger.info(`Wrong password for ${ escapedUsername }`);
			}

			if (settings.getAs<boolean>('LDAP_Find_User_After_Login')) {
				// Do a search as the user and check if they have any result
				authLogger.info('User authenticated successfully, performing additional search.');
				if (await ldap.searchAndCount(ldapUser.dn, {}) === 0) {
					authLogger.info(`Bind successful but user ${ ldapUser.dn } was not found via search`);
				}
			}

			callbacks.run('onFindLDAPUser', { ldapUser, escapedUsername }, ldap);

			return ldapUser;
		} catch (error) {
			logger.error(error);
		}
	}

	private static loginNewUserFromLDAP(slugifiedUsername: string, ldapPass: string, ldapUser: ILDAPEntry, ldap: LDAPConnection): LDAPLoginResult {
		logger.info({ msg: 'User does not exist, creating', username: slugifiedUsername });

		let username: string | undefined;

		if (getLDAPConditionalSetting('LDAP_Username_Field') !== '') {
			username = slugifiedUsername;
		}

		// Create new user
		return this.addLdapUser(ldapUser, username, ldapPass, ldap);
	}

	private static addLdapUser(ldapUser: ILDAPEntry, username: string | undefined, password: string | undefined, ldap: LDAPConnection): LDAPLoginResult {
		const user = this.syncUserForLogin(ldapUser, undefined, username);

		this.onLogin(ldapUser, user, password, ldap);
		if (user) {
			return {
				userId: user._id,
			};
		}
	}

	private static onLogin(ldapUser: ILDAPEntry, user: IUser | undefined, password: string | undefined, ldap: LDAPConnection): void {
		logger.info('running onLDAPLogin');
		callbacks.run('onLDAPLogin', { user, ldapUser, password }, ldap);
	}

	private static loginExistingUser(ldap: LDAPConnection, user: IUser, ldapUser: ILDAPEntry, password: string): LDAPLoginResult {
		if (user.ldap !== true && settings.get('LDAP_Merge_Existing_Users') !== true) {
			logger.info('User exists without "ldap: true"');
			throw new Meteor.Error('LDAP-login-error', `LDAP Authentication succeeded, but there's already an existing user with provided username [${ user.username }] in Mongo.`);
		}

		logger.info('Logging user');

		const syncData = settings.getAs<boolean>('LDAP_Update_Data_On_Login');
		const updatedUser = (syncData && this.syncUserForLogin(ldapUser, user)) || user;

		this.onLogin(ldapUser, updatedUser, password, ldap);
		return {
			userId: user._id,
		};
	}

	private static syncUserForLogin(ldapUser: ILDAPEntry, existingUser?: IUser, usedUsername?: string | undefined): IUser | undefined {
		logger.info('Syncing user data');
		if (existingUser) {
			logger.debug({ msg: 'user', user: { email: existingUser.emails, _id: existingUser._id } });
		}
		logger.debug({ msg: 'ldapUser', ldapUser: ldapUser.object });

		const userData = this.mapUserData(ldapUser, usedUsername);
		const options = this.getConverterOptions();
		LDAPDataConverter.convertSingleUser(userData, options);

		return existingUser || this.findExistingLDAPUser(ldapUser);
	}

	private static getLdapUserUniqueID(ldapUser: ILDAPEntry): ILDAPUniqueIdentifierField | undefined {
		let uniqueIdentifierField: string | string[] | undefined = settings.getAs<string | undefined>('LDAP_Unique_Identifier_Field');

		if (uniqueIdentifierField) {
			uniqueIdentifierField = uniqueIdentifierField.replace(/\s/g, '').split(',');
		} else {
			uniqueIdentifierField = [];
		}

		let userSearchField: string | string[] | undefined = getLDAPConditionalSetting('LDAP_User_Search_Field') as string;

		if (userSearchField) {
			userSearchField = userSearchField.replace(/\s/g, '').split(',');
		} else {
			userSearchField = [];
		}

		uniqueIdentifierField = uniqueIdentifierField.concat(userSearchField);
		if (!uniqueIdentifierField.length) {
			uniqueIdentifierField.push('dn');
		}

		const key = uniqueIdentifierField.find((field) => !_.isEmpty(ldapUser._raw[field]));
		if (key) {
			return {
				attribute: key,
				value: ldapUser._raw[key].toString('hex'),
			};
		}

		connLogger.info('Failed to generate unique identifier for ldap entry');
		connLogger.debug(ldapUser);
	}

	private static ldapKeyExists(ldapUser: ILDAPEntry, key: string): boolean {
		return !_.isEmpty(ldapUser._raw[key.trim()]);
	}

	private static getLdapString(ldapUser: ILDAPEntry, key: string): string {
		return ldapUser._raw[key.trim()].toString('hex');
	}

	private static getLdapDynamicValue(ldapUser: ILDAPEntry, attributeSetting: string): string | undefined {
		if (!attributeSetting) {
			return;
		}

		// If the attribute setting is a template, then convert the variables in it
		if (attributeSetting.includes('#{')) {
			return attributeSetting.replace(/#{(.+?)}/g, (_match, field) => {
				const key = field.trim();

				if (this.ldapKeyExists(ldapUser, key)) {
					return this.getLdapString(ldapUser, key);
				}

				return '';
			});
		}

		// If it's not a template, then treat the setting as a CSV list of possible attribute names and return the first valid one.
		const attributeList: string[] = attributeSetting.replace(/\s/g, '').split(',');
		const key = attributeList.find((field) => this.ldapKeyExists(ldapUser, field));
		if (key) {
			return this.getLdapString(ldapUser, key);
		}
	}

	private static getLdapName(ldapUser: ILDAPEntry): string | undefined {
		const nameAttributes = getLDAPConditionalSetting('LDAP_Name_Field') as string;
		return this.getLdapDynamicValue(ldapUser, nameAttributes);
	}

	private static getLdapEmails(ldapUser: ILDAPEntry, username?: string): string[] {
		const emailAttributes = getLDAPConditionalSetting('LDAP_Email_Field') as string;
		if (emailAttributes) {
			const attributeList: string[] = emailAttributes.replace(/\s/g, '').split(',');
			const key = attributeList.find((field) => this.ldapKeyExists(ldapUser, field));

			const emails: string[] = [].concat(key ? ldapUser[key.trim()] : []);
			const filteredEmails = emails.filter((email) => email.includes('@'));

			if (filteredEmails.length) {
				return filteredEmails;
			}
		}

		if (settings.get('LDAP_Default_Domain') !== '' && username) {
			return [`${ username }@${ settings.get('LDAP_Default_Domain') }`];
		}

		if (ldapUser.mail && ldapUser.mail.includes('@')) {
			return [ldapUser.mail];
		}

		logger.debug(ldapUser);
		throw new Error('Failed to get email address from LDAP user');
	}

	private static slugify(text: string): string {
		if (settings.get('UTF8_Names_Slugify') !== true) {
			return text;
		}

		text = limax(text, { replacement: '.' });
		return text.replace(/[^0-9a-z-_.]/g, '');
	}

	private static slugifyUsername(ldapUser: ILDAPEntry, requestUsername: string): string {
		if (getLDAPConditionalSetting('LDAP_Username_Field') !== '') {
			return this.slugify(this.getLdapUsername(ldapUser));
		}

		return this.slugify(requestUsername);
	}

	private static getLdapUsername(ldapUser: ILDAPEntry): string {
		const usernameField = getLDAPConditionalSetting('LDAP_Username_Field') as string;
		return this.getLdapDynamicValue(ldapUser, usernameField) as string;
	}

	// This method will find existing users by LDAP id or by username.
	private static findExistingUser(ldapUser: ILDAPEntry, slugifiedUsername: string): IUser | undefined {
		const user = this.findExistingLDAPUser(ldapUser);
		if (user) {
			return user;
		}

		return Users.findOneByUsername(slugifiedUsername);
	}

	private static fallbackToDefaultLogin(username: LoginUsername, password: string): Record<string, any> | undefined {
		if (typeof username === 'string') {
			if (username.indexOf('@') === -1) {
				username = { username };
			} else {
				username = { email: username };
			}
		}

		logger.info({ msg: 'Fallback to default account system', username });

		const loginRequest = {
			user: username,
			password: {
				digest: SHA256(password),
				algorithm: 'sha-256',
			},
		};

		return Accounts._runLoginHandlers(this, loginRequest);
	}
}

import type { ILDAPEntry, LDAPLoginResult, ILDAPUniqueIdentifierField, IUser, LoginUsername, IImportUser } from '@rocket.chat/core-typings';
import { Users as UsersRaw } from '@rocket.chat/models';
import { SHA256 } from '@rocket.chat/sha256';
import ldapEscape from 'ldap-escape';
import limax from 'limax';
// #ToDo: #TODO: Remove Meteor dependencies
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { LDAPConnection } from './Connection';
import { logger, authLogger, connLogger } from './Logger';
import { LDAPUserConverter } from './UserConverter';
import { getLDAPConditionalSetting } from './getLDAPConditionalSetting';
import { getLdapDynamicValue } from './getLdapDynamicValue';
import { getLdapString } from './getLdapString';
import { ldapKeyExists } from './ldapKeyExists';
import type { UserConverterOptions } from '../../../app/importer/server/classes/converters/UserConverter';
import { setUserAvatar } from '../../../app/lib/server/functions/setUserAvatar';
import { settings } from '../../../app/settings/server';
import { callbacks } from '../../../lib/callbacks';
import { omit } from '../../../lib/utils/omit';

export class LDAPManager {
	public static async login(username: string, password: string): Promise<LDAPLoginResult> {
		logger.debug({ msg: 'Init LDAP login', username });

		if (settings.get('LDAP_Enable') !== true) {
			return this.fallbackToDefaultLogin(username, password);
		}

		let ldapUser: ILDAPEntry | undefined;

		const ldap = new LDAPConnection();
		try {
			try {
				await ldap.connect();
				ldapUser = await this.findUser(ldap, username, password);
			} catch (error) {
				logger.error(error);
			}

			if (ldapUser === undefined) {
				return this.fallbackToDefaultLogin(username, password);
			}

			const homeServer = this.getFederationHomeServer(ldapUser);
			if (homeServer) {
				return this.fallbackToDefaultLogin(username, password);
			}

			const slugifiedUsername = this.slugifyUsername(ldapUser, username);
			const user = await this.findExistingUser(ldapUser, slugifiedUsername);

			// Bind connection to the admin user so that RC has full access to groups in the next steps
			await ldap.bindAuthenticationUser();
			if (user) {
				return await this.loginExistingUser(ldap, user, ldapUser, password);
			}

			return await this.loginNewUserFromLDAP(slugifiedUsername, ldap, ldapUser, password);
		} finally {
			ldap.disconnect();
		}
	}

	public static async loginAuthenticatedUser(username: string): Promise<LDAPLoginResult> {
		logger.debug({ msg: 'Init LDAP login', username });

		if (settings.get('LDAP_Enable') !== true) {
			return;
		}

		let ldapUser: ILDAPEntry | undefined;

		const ldap = new LDAPConnection();
		try {
			try {
				await ldap.connect();
				ldapUser = await this.findAuthenticatedUser(ldap, username);
			} catch (error) {
				logger.error(error);
			}

			if (ldapUser === undefined) {
				return;
			}

			const homeServer = this.getFederationHomeServer(ldapUser);
			if (homeServer) {
				return;
			}

			const slugifiedUsername = this.slugifyUsername(ldapUser, username);
			const user = await this.findExistingUser(ldapUser, slugifiedUsername);

			if (user) {
				return await this.loginExistingUser(ldap, user, ldapUser);
			}

			return await this.loginNewUserFromLDAP(slugifiedUsername, ldap, ldapUser);
		} finally {
			ldap.disconnect();
		}
	}

	public static async testConnection(): Promise<void> {
		try {
			const ldap = new LDAPConnection();
			await ldap.testConnection();
		} catch (error) {
			connLogger.error(error);
			throw error;
		}
	}

	public static async testSearch(username: string): Promise<void> {
		const escapedUsername = ldapEscape.filter`${username}`;
		const ldap = new LDAPConnection();

		try {
			await ldap.connect();

			const users = await ldap.searchByUsername(escapedUsername);
			if (users.length !== 1) {
				logger.debug(`Search returned ${users.length} records for ${escapedUsername}`);
				throw new Error('User not found');
			}
		} catch (error) {
			logger.error(error);
			throw error;
		}
	}

	public static async syncUserAvatar(user: IUser, ldapUser: ILDAPEntry): Promise<void> {
		if (!user?._id || settings.get('LDAP_Sync_User_Avatar') !== true) {
			return;
		}

		const avatar = this.getAvatarFromUser(ldapUser);
		if (!avatar) {
			return;
		}

		const hash = SHA256(avatar.toString());
		if (user.avatarETag === hash) {
			return;
		}

		logger.debug({ msg: 'Syncing user avatar', username: user.username });

		await setUserAvatar(user, avatar, 'image/jpeg', 'rest', hash);
	}

	// This method will only find existing users that are already linked to LDAP
	protected static async findExistingLDAPUser(ldapUser: ILDAPEntry): Promise<IUser | undefined | null> {
		const uniqueIdentifierField = this.getLdapUserUniqueID(ldapUser);

		if (uniqueIdentifierField) {
			logger.debug({ msg: 'Querying user', uniqueId: uniqueIdentifierField.value });
			return UsersRaw.findOneByLDAPId<IUser>(uniqueIdentifierField.value, uniqueIdentifierField.attribute);
		}
	}

	protected static getConverterOptions(): UserConverterOptions {
		return {
			flagEmailsAsVerified: settings.get<boolean>('Accounts_Verify_Email_For_External_Accounts') ?? false,
			skipExistingUsers: false,
			skipUserCallbacks: false,
		};
	}

	protected static mapUserData(ldapUser: ILDAPEntry, usedUsername?: string | undefined): IImportUser {
		const uniqueId = this.getLdapUserUniqueID(ldapUser);
		if (!uniqueId) {
			throw new Error('Failed to generate unique identifier for ldap entry');
		}

		const { attribute: idAttribute, value: id } = uniqueId;
		const username = this.slugifyUsername(ldapUser, usedUsername || id || '') || undefined;
		const homeServer = this.getFederationHomeServer(ldapUser);
		const emails = this.getLdapEmails(ldapUser, username).map((email) => email.trim());
		const name = this.getLdapName(ldapUser) || undefined;
		const voipExtension = this.getLdapExtension(ldapUser);

		const userData: IImportUser = {
			type: 'user',
			emails,
			importIds: [ldapUser.dn],
			username,
			name,
			voipExtension,
			services: {
				ldap: {
					idAttribute,
					id,
				},
			},
			...(homeServer && {
				username: `${username}:${homeServer}`,
				federated: true,
			}),
		};

		this.onMapUserData(ldapUser, userData);
		return userData;
	}

	private static onMapUserData(ldapUser: ILDAPEntry, userData: IImportUser): void {
		void callbacks.run('mapLDAPUserData', userData, ldapUser);
	}

	private static async findUser(ldap: LDAPConnection, username: string, password: string): Promise<ILDAPEntry | undefined> {
		const escapedUsername = ldapEscape.filter`${username}`;

		try {
			const users = await ldap.searchByUsername(escapedUsername);

			if (users.length !== 1) {
				logger.debug(`Search returned ${users.length} records for ${escapedUsername}`);
				throw new Error('User not found');
			}

			const [ldapUser] = users;
			if (!(await ldap.isUserAcceptedByGroupFilter(escapedUsername, ldapUser.dn))) {
				throw new Error('User not found');
			}

			if (!(await ldap.authenticate(ldapUser.dn, password))) {
				logger.debug(`Wrong password for ${escapedUsername}`);
				throw new Error('Invalid user or wrong password');
			}

			if (settings.get<boolean>('LDAP_Find_User_After_Login')) {
				// Do a search as the user and check if they have any result
				authLogger.debug('User authenticated successfully, performing additional search.');
				if ((await ldap.searchAndCount(ldapUser.dn, {})) === 0) {
					authLogger.debug(`Bind successful but user ${ldapUser.dn} was not found via search`);
				}
			}
			return ldapUser;
		} catch (error) {
			logger.error(error);
		}
	}

	private static async findAuthenticatedUser(ldap: LDAPConnection, username: string): Promise<ILDAPEntry | undefined> {
		const escapedUsername = ldapEscape.filter`${username}`;

		try {
			const users = await ldap.searchByUsername(escapedUsername);

			if (users.length !== 1) {
				logger.debug(`Search returned ${users.length} records for ${escapedUsername}`);
				return;
			}

			const [ldapUser] = users;

			if (settings.get<boolean>('LDAP_Find_User_After_Login')) {
				// Do a search as the user and check if they have any result
				authLogger.debug('User authenticated successfully, performing additional search.');
				if ((await ldap.searchAndCount(ldapUser.dn, {})) === 0) {
					authLogger.debug(`Bind successful but user ${ldapUser.dn} was not found via search`);
				}
			}

			if (!(await ldap.isUserAcceptedByGroupFilter(escapedUsername, ldapUser.dn))) {
				throw new Error('User not in a valid group');
			}

			return ldapUser;
		} catch (error) {
			logger.error(error);
		}
	}

	private static async loginNewUserFromLDAP(
		slugifiedUsername: string,
		ldap: LDAPConnection,
		ldapUser: ILDAPEntry,
		ldapPass?: string,
	): Promise<LDAPLoginResult> {
		logger.debug({ msg: 'User does not exist, creating', username: slugifiedUsername });

		let username: string | undefined;

		if (getLDAPConditionalSetting('LDAP_Username_Field') !== '') {
			username = slugifiedUsername;
		}

		// Create new user
		return this.addLdapUser(ldapUser, username, ldapPass, ldap);
	}

	private static async addLdapUser(
		ldapUser: ILDAPEntry,
		username: string | undefined,
		password: string | undefined,
		ldap: LDAPConnection,
	): Promise<LDAPLoginResult> {
		const user = await this.syncUserForLogin(ldapUser, undefined, username);

		if (!user) {
			return;
		}

		await this.onLogin(ldapUser, user, password, ldap, true);

		return {
			userId: user._id,
		};
	}

	private static async onLogin(
		ldapUser: ILDAPEntry,
		user: IUser,
		password: string | undefined,
		ldap: LDAPConnection,
		isNewUser: boolean,
	): Promise<void> {
		logger.debug('running onLDAPLogin');
		if (settings.get<boolean>('LDAP_Login_Fallback') && typeof password === 'string' && password.trim() !== '') {
			await Accounts.setPasswordAsync(user._id, password, { logout: false });
		}

		await this.syncUserAvatar(user, ldapUser);
		await callbacks.run('onLDAPLogin', { user, ldapUser, isNewUser }, ldap);
	}

	private static async loginExistingUser(
		ldap: LDAPConnection,
		user: IUser,
		ldapUser: ILDAPEntry,
		password?: string,
	): Promise<LDAPLoginResult> {
		if (user.ldap !== true && settings.get('LDAP_Merge_Existing_Users') !== true) {
			logger.debug('User exists without "ldap: true"');
			throw new Meteor.Error(
				'LDAP-login-error',
				`LDAP Authentication succeeded, but there's already an existing user with provided username [${user.username}] in Mongo.`,
			);
		}

		// If we're merging an ldap user with a local user, then we need to sync the data even if 'update data on login' is off.
		const forceUserSync = !user.ldap;

		const syncData = forceUserSync || (settings.get<boolean>('LDAP_Update_Data_On_Login') ?? true);
		logger.debug({ msg: 'Logging user in', syncData });
		const updatedUser = (syncData && (await this.syncUserForLogin(ldapUser, user))) || user;

		await this.onLogin(ldapUser, updatedUser, password, ldap, false);
		return {
			userId: user._id,
		};
	}

	private static async syncUserForLogin(
		ldapUser: ILDAPEntry,
		existingUser?: IUser,
		usedUsername?: string | undefined,
	): Promise<IUser | undefined | null> {
		logger.debug({
			msg: 'Syncing user data',
			ldapUser: omit(ldapUser, '_raw'),
			user: { ...(existingUser && { email: existingUser.emails, _id: existingUser._id }) },
		});

		const userData = this.mapUserData(ldapUser, usedUsername);

		// make sure to persist existing user data when passing to sync/convert
		// TODO this is only needed because ImporterDataConverter assigns a default role and type if nothing is set. we might need to figure out a better way and stop doing that there
		if (existingUser) {
			if (!userData.roles && existingUser.roles) {
				userData.roles = existingUser.roles;
			}
			if (!userData.type && existingUser.type) {
				userData.type = existingUser.type as IImportUser['type'];
			}
		}

		const options = this.getConverterOptions();
		await LDAPUserConverter.convertSingleUser(userData, options);

		return existingUser || this.findExistingLDAPUser(ldapUser);
	}

	private static getLdapUserUniqueID(ldapUser: ILDAPEntry): ILDAPUniqueIdentifierField | undefined {
		let uniqueIdentifierField: string | string[] | undefined = settings.get<string>('LDAP_Unique_Identifier_Field');

		if (uniqueIdentifierField) {
			uniqueIdentifierField = uniqueIdentifierField.replace(/\s/g, '').split(',');
		} else {
			uniqueIdentifierField = [];
		}

		let userSearchField: string | string[] | undefined = getLDAPConditionalSetting<string>('LDAP_User_Search_Field');

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

		connLogger.warn('Failed to generate unique identifier for ldap entry');
		connLogger.debug(ldapUser);
	}

	private static getLdapName(ldapUser: ILDAPEntry): string | undefined {
		const nameAttributes = getLDAPConditionalSetting<string | undefined>('LDAP_Name_Field');
		return getLdapDynamicValue(ldapUser, nameAttributes);
	}

	private static getLdapExtension(ldapUser: ILDAPEntry): string | undefined {
		const extensionAttribute = settings.get<string>('LDAP_Extension_Field');
		if (!extensionAttribute) {
			return;
		}

		return getLdapString(ldapUser, extensionAttribute);
	}

	private static getLdapEmails(ldapUser: ILDAPEntry, username?: string): string[] {
		const emailAttributes = getLDAPConditionalSetting<string>('LDAP_Email_Field');
		if (emailAttributes) {
			const attributeList: string[] = emailAttributes.replace(/\s/g, '').split(',');
			const key = attributeList.find((field) => ldapKeyExists(ldapUser, field));

			const emails: string[] = [].concat(key ? ldapUser[key.trim()] : []);
			const filteredEmails = emails.filter((email) => email.includes('@'));

			if (filteredEmails.length) {
				return filteredEmails;
			}
		}

		if (settings.get('LDAP_Default_Domain') !== '' && username) {
			return [`${username}@${settings.get('LDAP_Default_Domain')}`];
		}

		if (ldapUser.mail?.includes('@')) {
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
			const username = this.getLdapUsername(ldapUser);
			if (username) {
				return this.slugify(username);
			}
		}

		return this.slugify(requestUsername);
	}

	protected static getLdapUsername(ldapUser: ILDAPEntry): string | undefined {
		const usernameField = getLDAPConditionalSetting('LDAP_Username_Field') as string;
		return getLdapDynamicValue(ldapUser, usernameField);
	}

	protected static getFederationHomeServer(ldapUser: ILDAPEntry): string | undefined {
		if (!settings.get<boolean>('Federation_Matrix_enabled')) {
			return;
		}

		const homeServerField = settings.get<string>('LDAP_FederationHomeServer_Field');
		const homeServer = getLdapDynamicValue(ldapUser, homeServerField);

		if (!homeServer) {
			return;
		}

		logger.debug({ msg: 'User has a federation home server', homeServer });

		const localServer = settings.get<string>('Federation_Matrix_homeserver_domain');
		if (localServer === homeServer) {
			return;
		}

		return homeServer;
	}

	protected static getFederatedUsername(ldapUser: ILDAPEntry, requestUsername: string): string {
		const username = this.slugifyUsername(ldapUser, requestUsername);
		const homeServer = this.getFederationHomeServer(ldapUser);

		if (homeServer) {
			return `${username}:${homeServer}`;
		}

		return username;
	}

	// This method will find existing users by LDAP id or by username.
	private static async findExistingUser(ldapUser: ILDAPEntry, slugifiedUsername: string): Promise<IUser | undefined | null> {
		const user = await this.findExistingLDAPUser(ldapUser);
		if (user) {
			return user;
		}

		// If we don't have that ldap user linked yet, check if there's any non-ldap user with the same username
		return UsersRaw.findOneWithoutLDAPByUsernameIgnoringCase<IUser>(slugifiedUsername);
	}

	private static fallbackToDefaultLogin(username: LoginUsername, password: string): LDAPLoginResult {
		if (typeof username === 'string') {
			if (username.indexOf('@') === -1) {
				username = { username };
			} else {
				username = { email: username };
			}
		}

		logger.debug({ msg: 'Fallback to default account system', username });

		const loginRequest = {
			user: username,
			password: {
				digest: SHA256(password),
				algorithm: 'sha-256',
			},
		};

		return Accounts._runLoginHandlers(this, loginRequest);
	}

	private static getAvatarFromUser(ldapUser: ILDAPEntry): any | undefined {
		const avatarField = String(settings.get('LDAP_Avatar_Field') || '').trim();
		if (avatarField && ldapUser._raw[avatarField]) {
			return ldapUser._raw[avatarField];
		}

		if (ldapUser._raw.thumbnailPhoto) {
			return ldapUser._raw.thumbnailPhoto;
		}

		if (ldapUser._raw.jpegPhoto) {
			return ldapUser._raw.jpegPhoto;
		}
	}
}

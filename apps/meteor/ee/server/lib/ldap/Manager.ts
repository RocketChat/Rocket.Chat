import { Team } from '@rocket.chat/core-services';
import type { ILDAPEntry, IUser, IRoom, IRole, IImportUser, IImportRecord } from '@rocket.chat/core-typings';
import { Users, Roles, Subscriptions as SubscriptionsRaw, Rooms } from '@rocket.chat/models';
import type ldapjs from 'ldapjs';

import type {
	ImporterAfterImportCallback,
	ImporterBeforeImportCallback,
} from '../../../../app/importer/server/definitions/IConversionCallbacks';
import { addUserToRoom } from '../../../../app/lib/server/functions/addUserToRoom';
import { createRoom } from '../../../../app/lib/server/functions/createRoom';
import { removeUserFromRoom } from '../../../../app/lib/server/functions/removeUserFromRoom';
import { setUserActiveStatus } from '../../../../app/lib/server/functions/setUserActiveStatus';
import { settings } from '../../../../app/settings/server';
import { getValidRoomName } from '../../../../app/utils/server/lib/getValidRoomName';
import { ensureArray } from '../../../../lib/utils/arrayUtils';
import { LDAPConnection } from '../../../../server/lib/ldap/Connection';
import { LDAPDataConverter } from '../../../../server/lib/ldap/DataConverter';
import { logger, searchLogger, mapLogger } from '../../../../server/lib/ldap/Logger';
import { LDAPManager } from '../../../../server/lib/ldap/Manager';
import { syncUserRoles } from '../syncUserRoles';
import { copyCustomFieldsLDAP } from './copyCustomFieldsLDAP';

export class LDAPEEManager extends LDAPManager {
	public static async sync(): Promise<void> {
		if (settings.get('LDAP_Enable') !== true || settings.get('LDAP_Background_Sync') !== true) {
			return;
		}

		const createNewUsers = settings.get<boolean>('LDAP_Background_Sync_Import_New_Users') ?? true;
		const updateExistingUsers = settings.get<boolean>('LDAP_Background_Sync_Keep_Existant_Users_Updated') ?? true;
		let disableMissingUsers = updateExistingUsers && (settings.get<boolean>('LDAP_Background_Sync_Disable_Missing_Users') ?? false);
		const mergeExistingUsers = settings.get<boolean>('LDAP_Background_Sync_Merge_Existent_Users') ?? false;

		const options = this.getConverterOptions();
		options.skipExistingUsers = !updateExistingUsers;
		options.skipNewUsers = !createNewUsers;

		const ldap = new LDAPConnection();
		const converter = new LDAPDataConverter(true, options);
		const touchedUsers = new Set<IUser['_id']>();

		try {
			await ldap.connect();

			if (createNewUsers || mergeExistingUsers) {
				await this.importNewUsers(ldap, converter);
			} else if (updateExistingUsers) {
				await this.updateExistingUsers(ldap, converter, disableMissingUsers);
				// Missing users will have been disabled automatically by the update operation, so no need to do a separate query for them
				disableMissingUsers = false;
			}

			const membersOfGroupFilter = await ldap.searchMembersOfGroupFilter();

			await converter.convertUsers({
				beforeImportFn: (async ({ options }: IImportRecord): Promise<boolean> => {
					if (!ldap.options.groupFilterEnabled || !ldap.options.groupFilterGroupMemberFormat) {
						return true;
					}

					const memberFormat = ldap.options.groupFilterGroupMemberFormat
						?.replace(/#{username}/g, options?.username || '#{username}')
						.replace(/#{userdn}/g, options?.dn || '#{userdn}');

					return membersOfGroupFilter.includes(memberFormat);
				}) as ImporterBeforeImportCallback,
				afterImportFn: (async ({ data }, isNewRecord: boolean): Promise<void> => {
					if (data._id) {
						touchedUsers.add(data._id);
					}
					await this.advancedSync(ldap, data as IImportUser, converter, isNewRecord);
				}) as ImporterAfterImportCallback,
			});

			if (disableMissingUsers) {
				await this.disableMissingUsers([...touchedUsers]);
			}
		} catch (error) {
			logger.error(error);
		}

		ldap.disconnect();
	}

	public static async syncAvatars(): Promise<void> {
		if (settings.get('LDAP_Enable') !== true || settings.get('LDAP_Background_Sync_Avatars') !== true) {
			return;
		}

		try {
			const ldap = new LDAPConnection();
			await ldap.connect();

			try {
				await this.updateUserAvatars(ldap);
			} finally {
				ldap.disconnect();
			}
		} catch (error) {
			logger.error(error);
		}
	}

	public static validateLDAPTeamsMappingChanges(json: string): void {
		if (!json) {
			return;
		}

		const mustBeAnArrayOfStrings = (array: Array<string>): boolean =>
			Boolean(Array.isArray(array) && array.length && array.every((item) => typeof item === 'string'));
		const mappedTeams = this.parseJson(json);
		if (!mappedTeams) {
			return;
		}

		const mappedRocketChatTeams = Object.values(mappedTeams);
		const validStructureMapping = mappedRocketChatTeams.every(mustBeAnArrayOfStrings);
		if (!validStructureMapping) {
			throw new Error(
				'Please verify your mapping for LDAP X RocketChat Teams. The structure is invalid, the structure should be an object like: {key: LdapTeam, value: [An array of rocket.chat teams]}',
			);
		}
	}

	public static async syncLogout(): Promise<void> {
		if (settings.get('LDAP_Enable') !== true || settings.get('LDAP_Sync_AutoLogout_Enabled') !== true) {
			return;
		}

		try {
			const ldap = new LDAPConnection();
			await ldap.connect();

			try {
				await this.logoutDeactivatedUsers(ldap);
			} finally {
				ldap.disconnect();
			}
		} catch (error) {
			logger.error(error);
		}
	}

	public static async advancedSyncForUser(ldap: LDAPConnection, user: IUser, isNewRecord: boolean, dn: string): Promise<void> {
		try {
			await this.syncUserRoles(ldap, user, dn);
			await this.syncUserChannels(ldap, user, dn);
			await this.syncUserTeams(ldap, user, dn, isNewRecord);
		} catch (e) {
			logger.debug(`Advanced Sync failed for user: ${dn}`);
			logger.error(e);
		}
	}

	private static async advancedSync(
		ldap: LDAPConnection,
		importUser: IImportUser,
		converter: LDAPDataConverter,
		isNewRecord: boolean,
	): Promise<void> {
		const user = await converter.findExistingUser(importUser);
		if (!user?.username) {
			return;
		}

		const dn = importUser.importIds[0];
		return this.advancedSyncForUser(ldap, user, isNewRecord, dn);
	}

	private static async isUserInGroup(
		ldap: LDAPConnection,
		baseDN: string,
		filter: string,
		{ dn, username }: { dn: string; username: string },
		groupName: string,
	): Promise<boolean> {
		if (!filter || !baseDN) {
			logger.error('Please setup LDAP Group Filter and LDAP Group BaseDN in LDAP Settings.');
			return false;
		}
		const searchOptions: ldapjs.SearchOptions = {
			filter: filter
				.replace(/#{username}/g, username)
				.replace(/#{groupName}/g, groupName)
				.replace(/#{userdn}/g, dn.replace(/\\/g, '\\5c')),
			scope: 'sub',
		};

		const result = await ldap.searchRaw(baseDN, searchOptions);

		if (!Array.isArray(result) || result.length === 0) {
			logger.debug(`${username} is not in ${groupName} group!!!`);
		} else {
			logger.debug(`${username} is in ${groupName} group.`);
			return true;
		}

		return false;
	}

	private static parseJson(json: string): Record<string, any> | undefined {
		try {
			return JSON.parse(json);
		} catch (err) {
			logger.error({ msg: 'Unexpected error', err });
		}
	}

	private static async syncUserRoles(ldap: LDAPConnection, user: IUser, dn: string): Promise<void> {
		const { username } = user;
		if (!username) {
			logger.debug('User has no username');
			return;
		}

		const shouldSyncUserRoles = settings.get<boolean>('LDAP_Sync_User_Data_Roles') ?? false;
		const syncUserRolesAutoRemove = settings.get<boolean>('LDAP_Sync_User_Data_Roles_AutoRemove') ?? false;
		const syncUserRolesFieldMap = (settings.get<string>('LDAP_Sync_User_Data_RolesMap') ?? '').trim();
		const syncUserRolesFilter = (settings.get<string>('LDAP_Sync_User_Data_Roles_Filter') ?? '').trim();
		const syncUserRolesBaseDN = (settings.get<string>('LDAP_Sync_User_Data_Roles_BaseDN') ?? '').trim();

		if (!shouldSyncUserRoles || !syncUserRolesFieldMap) {
			logger.debug('not syncing user roles');
			return;
		}

		const roles = (await Roles.find(
			{},
			{
				projection: {
					_id: 1,
					name: 1,
				},
			},
		).toArray()) as Array<IRole>;

		if (!roles) {
			return;
		}

		const fieldMap = this.parseJson(syncUserRolesFieldMap);
		if (!fieldMap) {
			logger.debug('missing group role mapping');
			return;
		}

		const ldapFields = Object.keys(fieldMap);
		const roleList: Array<IRole['_id']> = [];
		const allowedRoles: Array<IRole['_id']> = [];

		for await (const ldapField of ldapFields) {
			if (!fieldMap[ldapField]) {
				continue;
			}

			const userFields = ensureArray<string>(fieldMap[ldapField]);

			for await (const userField of userFields) {
				const [roleIdOrName] = userField.split(/\.(.+)/);

				const role = roles.find((role) => role._id === roleIdOrName) ?? roles.find((role) => role.name === roleIdOrName);

				if (role) {
					allowedRoles.push(role._id);
				}

				if (await this.isUserInGroup(ldap, syncUserRolesBaseDN, syncUserRolesFilter, { dn, username }, ldapField)) {
					if (role) {
						roleList.push(role._id);
					}
					continue;
				}
			}
		}

		await syncUserRoles(user._id, roleList, {
			allowedRoles,
			skipRemovingRoles: !syncUserRolesAutoRemove,
		});
	}

	private static async createRoomForSync(channel: string): Promise<IRoom | undefined> {
		logger.debug(`Channel '${channel}' doesn't exist, creating it.`);

		const roomOwner = settings.get<string>('LDAP_Sync_User_Data_Channels_Admin') || '';

		const user = await Users.findOneByUsernameIgnoringCase(roomOwner);

		const room = await createRoom('c', channel, user, [], false, false, {
			customFields: { ldap: true },
		});
		if (!room?.rid) {
			logger.error(`Unable to auto-create channel '${channel}' during ldap sync.`);
			return;
		}

		room._id = room.rid;
		return room;
	}

	private static async syncUserChannels(ldap: LDAPConnection, user: IUser, dn: string): Promise<void> {
		const syncUserChannels = settings.get<boolean>('LDAP_Sync_User_Data_Channels') ?? false;
		const syncUserChannelsRemove = settings.get<boolean>('LDAP_Sync_User_Data_Channels_Enforce_AutoChannels') ?? false;
		const syncUserChannelsFieldMap = (settings.get<string>('LDAP_Sync_User_Data_ChannelsMap') ?? '').trim();
		const syncUserChannelsFilter = (settings.get<string>('LDAP_Sync_User_Data_Channels_Filter') ?? '').trim();
		const syncUserChannelsBaseDN = (settings.get<string>('LDAP_Sync_User_Data_Channels_BaseDN') ?? '').trim();

		if (!syncUserChannels || !syncUserChannelsFieldMap) {
			logger.debug('not syncing groups to channels');
			return;
		}

		const fieldMap = this.parseJson(syncUserChannelsFieldMap);
		if (!fieldMap) {
			logger.debug('missing group channel mapping');
			return;
		}

		const { username } = user;
		if (!username) {
			return;
		}

		logger.debug('syncing user channels');
		const ldapFields = Object.keys(fieldMap);
		const channelsToAdd = new Set<string>();
		const channelsToRemove = new Set<string>();

		for await (const ldapField of ldapFields) {
			if (!fieldMap[ldapField]) {
				continue;
			}

			const isUserInGroup = await this.isUserInGroup(ldap, syncUserChannelsBaseDN, syncUserChannelsFilter, { dn, username }, ldapField);

			const channels: Array<string> = [].concat(fieldMap[ldapField]);
			for await (const channel of channels) {
				try {
					const name = await getValidRoomName(channel.trim(), undefined, { allowDuplicates: true });
					const room = (await Rooms.findOneByNonValidatedName(name)) || (await this.createRoomForSync(channel));
					if (!room) {
						return;
					}

					if (isUserInGroup) {
						if (room.teamMain) {
							logger.error(`Can't add user to channel ${channel} because it is a team.`);
						} else {
							channelsToAdd.add(room._id);
						}
					} else if (syncUserChannelsRemove && !room.teamMain) {
						channelsToRemove.add(room._id);
					}
				} catch (e) {
					logger.debug(`Failed to sync user room, user = ${username}, channel = ${channel}`);
					logger.error(e);
				}
			}
		}

		for await (const rid of channelsToAdd) {
			await addUserToRoom(rid, user);
			logger.debug(`Synced user channel ${rid} from LDAP for ${username}`);
		}

		for await (const rid of channelsToRemove) {
			if (channelsToAdd.has(rid)) {
				return;
			}

			const subscription = await SubscriptionsRaw.findOneByRoomIdAndUserId(rid, user._id);
			if (subscription) {
				await removeUserFromRoom(rid, user);
				logger.debug(`Removed user ${username} from channel ${rid}`);
			}
		}
	}

	private static async syncUserTeams(ldap: LDAPConnection, user: IUser, dn: string, isNewRecord: boolean): Promise<void> {
		if (!user.username) {
			return;
		}

		const mapTeams =
			settings.get<boolean>('LDAP_Enable_LDAP_Groups_To_RC_Teams') &&
			(isNewRecord || settings.get<boolean>('LDAP_Validate_Teams_For_Each_Login'));
		if (!mapTeams) {
			return;
		}

		const ldapUserTeams = await this.getLdapTeamsByUsername(ldap, user.username, dn);
		const mapJson = settings.get<string>('LDAP_Groups_To_Rocket_Chat_Teams');
		if (!mapJson) {
			return;
		}
		const map = this.parseJson(mapJson) as Record<string, string>;
		if (!map) {
			return;
		}

		const teamNames = this.getRocketChatTeamsByLdapTeams(map, ldapUserTeams);

		const allTeamNames = [...new Set(Object.values(map).flat())];
		const allTeams = await Team.listByNames(allTeamNames, { projection: { _id: 1, name: 1 } });

		const inTeamIds = allTeams.filter(({ name }) => teamNames.includes(name)).map(({ _id }) => _id);
		const notInTeamIds = allTeams.filter(({ name }) => !teamNames.includes(name)).map(({ _id }) => _id);

		const currentTeams = await Team.listTeamsBySubscriberUserId(user._id, {
			projection: { teamId: 1 },
		});
		const currentTeamIds = currentTeams?.map(({ teamId }) => teamId);
		const teamsToRemove = currentTeamIds?.filter((teamId) => notInTeamIds.includes(teamId));
		const teamsToAdd = inTeamIds.filter((teamId) => !currentTeamIds?.includes(teamId));

		await Team.insertMemberOnTeams(user._id, teamsToAdd);
		if (teamsToRemove) {
			await Team.removeMemberFromTeams(user._id, teamsToRemove);
		}
	}

	private static getRocketChatTeamsByLdapTeams(mappedTeams: Record<string, string>, ldapUserTeams: Array<string>): Array<string> {
		const mappedLdapTeams = Object.keys(mappedTeams);
		const filteredTeams = ldapUserTeams.filter((ldapTeam) => mappedLdapTeams.includes(ldapTeam));

		if (filteredTeams.length < ldapUserTeams.length) {
			const unmappedLdapTeams = ldapUserTeams.filter((ldapTeam) => !mappedLdapTeams.includes(ldapTeam));
			logger.error(`The following LDAP teams are not mapped in Rocket.Chat: "${unmappedLdapTeams.join(', ')}".`);
		}

		if (!filteredTeams.length) {
			return [];
		}

		return [...new Set(filteredTeams.map((ldapTeam) => mappedTeams[ldapTeam]).flat())];
	}

	private static async getLdapTeamsByUsername(ldap: LDAPConnection, username: string, dn: string): Promise<Array<string>> {
		const baseDN = (settings.get<string>('LDAP_Teams_BaseDN') ?? '').trim() || ldap.options.baseDN;
		const query = settings.get<string>('LDAP_Query_To_Get_User_Teams');
		if (!query) {
			return [];
		}

		const searchOptions = {
			filter: query.replace(/#{username}/g, username).replace(/#{userdn}/g, dn.replace(/\\/g, '\\5c')),
			scope: ldap.options.userSearchScope || 'sub',
			sizeLimit: ldap.options.searchSizeLimit,
		};

		const attributeNames = (settings.get<string>('LDAP_Teams_Name_Field') ?? '').split(',').map((attributeName) => attributeName.trim());
		if (!attributeNames.length) {
			attributeNames.push('ou');
		}

		const ldapUserGroups = await ldap.searchRaw(baseDN, searchOptions);
		if (!Array.isArray(ldapUserGroups)) {
			return [];
		}

		return ldapUserGroups
			.map((entry) => {
				if (!entry?.raw) {
					return undefined;
				}

				for (const attributeName of attributeNames) {
					if (entry.raw[attributeName]) {
						return ldap.extractLdapAttribute(entry.raw[attributeName]) as string;
					}
				}

				return undefined;
			})
			.filter((entry): entry is string => Boolean(entry))
			.flat();
	}

	private static isUserDeactivated(ldapUser: ILDAPEntry): boolean {
		// Account locked by "Draft-behera-ldap-password-policy"
		if (ldapUser.pwdAccountLockedTime) {
			mapLogger.debug('User account is locked by password policy (attribute pwdAccountLockedTime)');
			return true;
		}

		// EDirectory: Account manually disabled by an admin
		if (ldapUser.loginDisabled) {
			mapLogger.debug('User account was manually disabled by an admin (attribute loginDisabled)');
			return true;
		}

		// Oracle: Account must not be allowed to authenticate
		if (ldapUser.orclIsEnabled && ldapUser.orclIsEnabled !== 'ENABLED') {
			mapLogger.debug('User must not be allowed to authenticate (attribute orclIsEnabled)');
			return true;
		}

		// Active Directory - Account locked automatically by security policies
		if (ldapUser.lockoutTime && ldapUser.lockoutTime !== '0') {
			const lockoutTimeValue = Number(ldapUser.lockoutTime);
			if (lockoutTimeValue && !isNaN(lockoutTimeValue)) {
				// Automatic unlock is disabled
				if (!ldapUser.lockoutDuration) {
					mapLogger.debug('User account locked indefinitely by security policy (attribute lockoutTime)');
					return true;
				}

				const lockoutTime = new Date(lockoutTimeValue);
				lockoutTime.setMinutes(lockoutTime.getMinutes() + Number(ldapUser.lockoutDuration));
				// Account has not unlocked itself yet
				if (lockoutTime.valueOf() > Date.now()) {
					mapLogger.debug('User account locked temporarily by security policy (attribute lockoutTime)');
					return true;
				}
			}
		}

		// Active Directory - Account disabled by an Admin
		if (ldapUser.userAccountControl && (ldapUser.userAccountControl & 2) === 2) {
			mapLogger.debug('User account disabled by an admin (attribute userAccountControl)');
			return true;
		}

		return false;
	}

	public static copyActiveState(ldapUser: ILDAPEntry, userData: IImportUser): void {
		if (!ldapUser) {
			return;
		}

		const syncUserState = settings.get('LDAP_Sync_User_Active_State');
		if (syncUserState === 'none') {
			return;
		}

		const deleted = this.isUserDeactivated(ldapUser);
		if (deleted === userData.deleted) {
			return;
		}

		if (syncUserState === 'disable' && !deleted) {
			return;
		}

		userData.deleted = deleted;
		logger.info(`${deleted ? 'Deactivating' : 'Activating'} user ${userData.name} (${userData.username})`);
	}

	public static copyCustomFields(ldapUser: ILDAPEntry, userData: IImportUser): void {
		return copyCustomFieldsLDAP(
			{
				ldapUser,
				userData,
				customFieldsSettings: settings.get<string>('Accounts_CustomFields'),
				customFieldsMap: settings.get<string>('LDAP_CustomFieldMap'),
				syncCustomFields: settings.get<boolean>('LDAP_Sync_Custom_Fields'),
			},
			logger,
		);
	}

	private static async importNewUsers(ldap: LDAPConnection, converter: LDAPDataConverter): Promise<void> {
		return new Promise((resolve, reject) => {
			let count = 0;

			void ldap.searchAllUsers<IImportUser>({
				entryCallback: (entry: ldapjs.SearchEntry): IImportUser | undefined => {
					const data = ldap.extractLdapEntryData(entry);
					count++;

					const userData = this.mapUserData(data);
					converter.addUserSync(userData, { dn: data.dn, username: this.getLdapUsername(data) });
					return userData;
				},
				endCallback: (error: any): void => {
					if (error) {
						logger.error(error);
						reject(error);
						return;
					}

					logger.info('LDAP finished loading users. Users added to importer: ', count);
					resolve();
				},
			});
		});
	}

	private static async updateExistingUsers(ldap: LDAPConnection, converter: LDAPDataConverter, disableMissingUsers = false): Promise<void> {
		const users = await Users.findLDAPUsers().toArray();
		for await (const user of users) {
			const ldapUser = await this.findLDAPUser(ldap, user);

			if (ldapUser) {
				const userData = this.mapUserData(ldapUser, user.username);
				converter.addUserSync(userData, { dn: ldapUser.dn, username: this.getLdapUsername(ldapUser) });
			} else if (disableMissingUsers) {
				await setUserActiveStatus(user._id, false, true);
			}
		}
	}

	private static async disableMissingUsers(foundUsers: IUser['_id'][]): Promise<void> {
		const userIds = (await Users.findLDAPUsersExceptIds(foundUsers, { projection: { _id: 1 } }).toArray()).map(({ _id }) => _id);

		await Promise.allSettled([...userIds].map((id) => setUserActiveStatus(id, false, true)));
	}

	private static async updateUserAvatars(ldap: LDAPConnection): Promise<void> {
		const users = await Users.findLDAPUsers().toArray();
		for await (const user of users) {
			const ldapUser = await this.findLDAPUser(ldap, user);
			if (!ldapUser) {
				continue;
			}

			await LDAPManager.syncUserAvatar(user, ldapUser);
		}
	}

	private static async findLDAPUser(ldap: LDAPConnection, user: IUser): Promise<ILDAPEntry | undefined> {
		if (user.services?.ldap?.id) {
			return ldap.findOneById(user.services.ldap.id, user.services.ldap.idAttribute);
		}

		if (user.username) {
			return ldap.findOneByUsername(user.username);
		}

		searchLogger.debug({
			msg: 'existing LDAP user not found during Sync',
			ldapId: user.services?.ldap?.id,
			ldapAttribute: user.services?.ldap?.idAttribute,
			username: user.username,
		});
	}

	private static async logoutDeactivatedUsers(ldap: LDAPConnection): Promise<void> {
		const users = await Users.findConnectedLDAPUsers().toArray();

		for await (const user of users) {
			const ldapUser = await this.findLDAPUser(ldap, user);
			if (!ldapUser) {
				continue;
			}

			if (this.isUserDeactivated(ldapUser)) {
				await Users.unsetLoginTokens(user._id);
			}
		}
	}
}

import type {
	IUser,
	IRole,
	IRoom,
	ILivechatAgent,
	UserStatus,
	ILoginToken,
	IPersonalAccessToken,
	AtLeast,
	ILivechatAgentStatus,
} from '@rocket.chat/core-typings';
import type { Document, UpdateResult, FindCursor, FindOptions, Filter, InsertOneResult, DeleteResult, ModifyResult } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IUsersModel extends IBaseModel<IUser> {
	addRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][]): Promise<UpdateResult>;
	findUsersInRoles<T = IUser>(roles: IRole['_id'][], scope?: null, options?: any): FindCursor<T>;
	findPaginatedUsersInRoles<T = IUser>(roles: IRole['_id'][], options?: any): FindPaginated<FindCursor<T>>;
	findOneByIdWithEmailAddress(uid: IUser['_id'], options?: FindOptions<IUser>): Promise<IUser | null>;
	findOneByUsername<T = IUser>(username: string, options?: any): Promise<T>;
	findOneAgentById<T = ILivechatAgent>(_id: string, options: any): Promise<T>;
	findUsersInRolesWithQuery<T = IUser>(roles: IRole['_id'] | IRole['_id'][], query: any, options: any): FindCursor<T>;
	findPaginatedUsersInRolesWithQuery<T = IUser>(
		roles: IRole['_id'] | IRole['_id'][],
		query: any,
		options: any,
	): FindPaginated<FindCursor<T>>;
	findOneByUsernameAndRoomIgnoringCase<T = IUser>(username: string, rid: IRoom['_id'], options: any): FindCursor<T>;
	findOneByIdAndLoginHashedToken<T = IUser>(_id: string, token: any, options?: any): FindCursor<T>;
	findByActiveUsersExcept<T = IUser>(
		searchTerm: any,
		exceptions: any,
		options: any,
		searchFields: any,
		extraQuery?: any,
		params?: { startsWith?: boolean; endsWith?: boolean },
	): FindCursor<T>;
	findPaginatedByActiveUsersExcept<T = IUser>(
		searchTerm: any,
		exceptions: any,
		options: any,
		searchFields: any,
		extraQuery?: any,
		params?: { startsWith?: boolean; endsWith?: boolean },
	): FindPaginated<FindCursor<T>>;

	findPaginatedByActiveLocalUsersExcept<T = IUser>(
		searchTerm: any,
		exceptions: any,
		options: any,
		forcedSearchFields: any,
		localDomain: any,
	): FindPaginated<FindCursor<T>>;

	findPaginatedByActiveExternalUsersExcept<T = IUser>(
		searchTerm: any,
		exceptions: any,
		options: any,
		forcedSearchFields: any,
		localDomain: any,
	): FindPaginated<FindCursor<T>>;

	findActive<T = IUser>(options?: any): FindCursor<T>;

	findActiveByIds<T = IUser>(userIds: any, options?: any): FindCursor<T>;

	findByIds<T = IUser>(userIds: any, options?: any): FindCursor<T>;

	findOneByUsernameIgnoringCase<T = IUser>(username: any, options?: any): Promise<T>;

	findOneWithoutLDAPByUsernameIgnoringCase<T = IUser>(username: string, options?: any): Promise<T>;

	findOneByLDAPId<T = IUser>(id: any, attribute?: any): Promise<T>;

	findOneByAppId<T = IUser>(appId: string, options?: FindOptions<IUser>): Promise<T | null>;

	findLDAPUsers<T = IUser>(options?: any): FindCursor<T>;

	findLDAPUsersExceptIds<T = IUser>(userIds: IUser['_id'][], options?: FindOptions<IUser>): FindCursor<T>;

	findConnectedLDAPUsers<T = IUser>(options?: any): FindCursor<T>;

	isUserInRole(userId: IUser['_id'], roleId: IRole['_id']): Promise<boolean>;

	getDistinctFederationDomains(): any;

	getNextLeastBusyAgent(
		department: any,
		ignoreAgentId: any,
	): Promise<{ agentId: string; username: string; lastRoutingTime: Date; departments: any[]; count: number }>;
	getLastAvailableAgentRouted(
		department: any,
		ignoreAgentId: any,
	): Promise<{ agentId: string; username: string; lastRoutingTime: Date; departments: any[] }>;

	setLastRoutingTime(userId: any): Promise<number>;

	setLivechatStatusIf(userId: string, status: ILivechatAgentStatus, conditions?: any, extraFields?: any): Promise<UpdateResult>;
	getAgentAndAmountOngoingChats(
		userId: any,
	): Promise<{ agentId: string; username: string; lastAssignTime: Date; lastRoutingTime: Date; queueInfo: { chats: number } }>;

	findAllResumeTokensByUserId(userId: any): any;

	findActiveByUsernameOrNameRegexWithExceptionsAndConditions<T = IUser>(
		termRegex: any,
		exceptions: any,
		conditions: any,
		options: any,
	): FindCursor<T>;

	countAllAgentsStatus({ departmentId }: { departmentId?: any }): any;

	getTotalOfRegisteredUsersByDate({ start, end, options }: { start: any; end: any; options?: any }): Promise<Document[]>;
	// TODO change back to below when convert model to TS
	// Promise<
	// 	{
	// 		date: string;
	// 		users: number;
	// 		type: 'users';
	// 	}[]
	// >;

	getUserLanguages(): any;

	updateStatusText(_id: any, statusText: any): any;

	updateStatusByAppId(appId: any, status: any): any;

	openAgentsBusinessHoursByBusinessHourId(businessHourIds: any): any;

	openAgentBusinessHoursByBusinessHourIdsAndAgentId(businessHourIds: string[], agentId: string): Promise<UpdateResult | Document>;

	addBusinessHourByAgentIds(agentIds: string[], businessHourId: string): any;

	makeAgentsWithinBusinessHourAvailable(agentIds?: string[]): Promise<UpdateResult | Document>;

	removeBusinessHourByAgentIds(agentIds: any, businessHourId: any): any;

	openBusinessHourToAgentsWithoutDepartment(agentIdsWithDepartment: any, businessHourId: any): any;

	closeBusinessHourToAgentsWithoutDepartment(agentIdsWithDepartment: any, businessHourId: any): any;

	closeAgentsBusinessHoursByBusinessHourIds(businessHourIds: any): any;

	updateLivechatStatusBasedOnBusinessHours(userIds?: any): any;

	setLivechatStatusActiveBasedOnBusinessHours(userId: any): any;

	isAgentWithinBusinessHours(agentId: string): Promise<boolean>;

	removeBusinessHoursFromAllUsers(): any;

	resetTOTPById(userId: any): any;

	unsetLoginTokens(userId: any): any;

	unsetOneLoginToken(userId: IUser['_id'], token: string): Promise<UpdateResult>;

	removeNonPATLoginTokensExcept(userId: any, authToken: any): any;

	removeRoomsByRoomIdsAndUserId(rids: any, userId: any): any;

	removeRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][]): Promise<UpdateResult>;

	isUserInRoleScope(uid: IUser['_id']): Promise<boolean>;

	addBannerById(_id: any, banner: any): any;

	findOneByAgentUsername(username: any, options: any): any;

	findOneByExtension(extension: any, options?: any): any;

	findByExtensions(extensions: any, options?: any): FindCursor<IUser>;

	getVoipExtensionByUserId(userId: any, options: any): any;

	setExtension(userId: any, extension: any): any;

	unsetExtension(userId: any): any;

	getAvailableAgentsIncludingExt(includeExt: any, text: any, options: any): FindPaginated<FindCursor<ILivechatAgent>>;

	findActiveUsersTOTPEnable(options: any): any;

	countActiveUsersTOTPEnable(options: any): Promise<number>;

	findActiveUsersEmail2faEnable(options: any): any;

	countActiveUsersEmail2faEnable(options: any): Promise<number>;

	findActiveByIdsOrUsernames(userIds: string[], options?: any): FindCursor<IUser>;

	setAsFederated(userId: string): any;

	removeRoomByRoomId(rid: any): any;

	findOneByResetToken(token: string, options: FindOptions<IUser>): Promise<IUser | null>;

	updateStatusById(
		userId: string,
		{
			statusDefault,
			status,
			statusConnection,
			statusText,
		}: { statusDefault?: string; status: UserStatus; statusConnection: UserStatus; statusText?: string },
	): Promise<UpdateResult>;

	setFederationAvatarUrlById(userId: string, federationAvatarUrl: string): Promise<void>;

	findSearchedServerNamesByUserId(userId: string): Promise<string[]>;

	addServerNameToSearchedServerNamesList(userId: string, serverName: string): Promise<UpdateResult>;

	removeServerNameFromSearchedServerNamesList(userId: string, serverName: string): Promise<UpdateResult>;

	countFederatedExternalUsers(): Promise<number>;
	findOnlineUserFromList(userList: string[], isLivechatEnabledWhenAgentIdle?: boolean): FindCursor<IUser>;
	getUnavailableAgents(
		departmentId?: string,
		extraQuery?: Document,
	): Promise<
		{
			agentId: string;
			username: string;
			lastAssignTime: string;
			lastRoutingTime: string;
			livechat: { maxNumberSimultaneousChat: number };
			queueInfo: { chats: number };
		}[]
	>;
	findOneOnlineAgentByUserList(
		userList: string[] | string,
		options?: FindOptions<IUser>,
		isLivechatEnabledWhenAgentIdle?: boolean,
	): Promise<IUser | null>;

	findBotAgents(usernameList?: string[]): FindCursor<IUser>;
	removeAllRoomsByUserId(userId: string): Promise<UpdateResult>;
	removeRoomByUserId(userId: string, rid: string): Promise<UpdateResult>;
	addRoomByUserId(userId: string, rid: string): Promise<UpdateResult>;
	addRoomByUserIds(uids: string[], rid: string): Promise<UpdateResult>;
	removeRoomByRoomIds(rids: string[]): Promise<UpdateResult | Document>;
	getLoginTokensByUserId(userId: string): FindCursor<ILoginToken>;
	addPersonalAccessTokenToUser(data: { userId: string; loginTokenObject: IPersonalAccessToken }): Promise<UpdateResult>;
	removePersonalAccessTokenOfUser(data: {
		userId: string;
		loginTokenObject: AtLeast<IPersonalAccessToken, 'type' | 'name'>;
	}): Promise<UpdateResult>;
	findPersonalAccessTokenByTokenNameAndUserId(data: { userId: string; tokenName: string }): Promise<IPersonalAccessToken | null>;
	setOperator(userId: string, operator: boolean): Promise<UpdateResult>;
	checkOnlineAgents(agentId?: string): Promise<boolean>;
	findOnlineAgents(agentId?: string): FindCursor<ILivechatAgent>;
	countOnlineAgents(agentId: string): Promise<number>;
	findOneBotAgent(): Promise<ILivechatAgent | null>;
	findOneOnlineAgentById(agentId: string, isLivechatEnabledWhenAgentIdle?: boolean): Promise<ILivechatAgent | null>;
	findAgents(): FindCursor<ILivechatAgent>;
	countAgents(): Promise<number>;
	getNextAgent(ignoreAgentId?: string, extraQuery?: Filter<IUser>): Promise<{ agentId: string; username: string } | null>;
	getNextBotAgent(ignoreAgentId?: string): Promise<{ agentId: string; username: string } | null>;
	setLivechatStatus(userId: string, status: ILivechatAgentStatus): Promise<UpdateResult>;
	makeAgentUnavailableAndUnsetExtension(userId: string): Promise<UpdateResult>;
	setLivechatData(userId: string, data?: Record<string, any>): Promise<UpdateResult>;
	closeOffice(): Promise<void>;
	openOffice(): Promise<void>;
	getAgentInfo(
		agentId: string,
		showAgentEmail?: boolean,
	): Promise<Pick<ILivechatAgent, '_id' | 'name' | 'username' | 'phone' | 'customFields' | 'status' | 'livechat'> | null>;
	roleBaseQuery(userId: string): { _id: string };
	setE2EPublicAndPrivateKeysByUserId(userId: string, e2e: { public_key: string; private_key: string }): Promise<UpdateResult>;
	rocketMailUnsubscribe(userId: string, createdAt: string): Promise<number>;
	fetchKeysByUserId(userId: string): Promise<{ public_key: string; private_key: string } | Record<string, never>>;
	disable2FAAndSetTempSecretByUserId(userId: string, tempSecret: string): Promise<UpdateResult>;
	enable2FAAndSetSecretAndCodesByUserId(userId: string, secret: string, codes: string[]): Promise<UpdateResult>;
	disable2FAByUserId(userId: string): Promise<UpdateResult>;
	update2FABackupCodesByUserId(userId: string, codes: string[]): Promise<UpdateResult>;
	enableEmail2FAByUserId(userId: string): Promise<UpdateResult>;
	disableEmail2FAByUserId(userId: string): Promise<UpdateResult>;
	findByIdsWithPublicE2EKey(userIds: string[], options?: FindOptions<IUser>): FindCursor<IUser>;
	resetE2EKey(userId: string): Promise<UpdateResult>;
	removeExpiredEmailCodeOfUserId(userId: string): Promise<UpdateResult>;
	removeEmailCodeByUserId(userId: string): Promise<UpdateResult>;
	increaseInvalidEmailCodeAttempt(userId: string): Promise<UpdateResult>;
	maxInvalidEmailCodeAttemptsReached(userId: string, maxAttemtps: number): Promise<boolean>;
	addEmailCodeByUserId(userId: string, code: string, expire: Date): Promise<UpdateResult>;
	findActiveUsersInRoles(roles: string[], options?: FindOptions<IUser>): FindCursor<IUser>;
	countActiveUsersInRoles(roles: string[], options?: FindOptions<IUser>): Promise<number>;
	findOneByUsernameAndServiceNameIgnoringCase(
		username: string,
		userId: string,
		serviceName: string,
		options?: FindOptions<IUser>,
	): Promise<IUser | null>;
	findOneByEmailAddressAndServiceNameIgnoringCase(
		emailAddress: string,
		userId: string,
		serviceName: string,
		options?: FindOptions<IUser>,
	): Promise<IUser | null>;
	findOneByEmailAddress(emailAddress: string, options?: FindOptions<IUser>): Promise<IUser | null>;
	findOneWithoutLDAPByEmailAddress(emailAddress: string, options?: FindOptions<IUser>): Promise<IUser | null>;
	findOneAdmin(userId: string, options?: FindOptions<IUser>): Promise<IUser | null>;
	findOneByIdAndLoginToken(userId: string, loginToken: string, options?: FindOptions<IUser>): Promise<IUser | null>;
	findOneActiveById(userId: string, options?: FindOptions<IUser>): Promise<IUser | null>;
	findOneByIdOrUsername(userId: string, options?: FindOptions<IUser>): Promise<IUser | null>;
	findOneByRolesAndType(roles: string[], type: string, options?: FindOptions<IUser>): Promise<IUser | null>;
	findNotOfflineByIds(userIds: string[], options?: FindOptions<IUser>): FindCursor<IUser>;
	findUsersNotOffline(options?: FindOptions<IUser>): FindCursor<IUser>;
	countUsersNotOffline(options?: FindOptions<IUser>): Promise<number>;
	findNotIdUpdatedFrom(userId: string, updatedFrom: Date, options?: FindOptions<IUser>): FindCursor<IUser>;
	findByRoomId(roomId: string, options?: FindOptions<IUser>): FindCursor<IUser>;
	findByUsername(username: string, options?: FindOptions<IUser>): FindCursor<IUser>;
	findByUsernames(usernames: string[], options?: FindOptions<IUser>): FindCursor<IUser>;
	findByUsernamesIgnoringCase(usernames: string[], options?: FindOptions<IUser>): FindCursor<IUser>;
	findActiveByUserIds(userIds: string[], options?: FindOptions<IUser>): FindCursor<IUser>;
	findActiveLocalGuests(idsExceptions: string[], options?: FindOptions<IUser>): FindCursor<IUser>;
	countActiveLocalGuests(idsExceptions: string[]): Promise<number>;
	findUsersByNameOrUsername(name: string, options?: FindOptions<IUser>): FindCursor<IUser>;
	findByUsernameNameOrEmailAddress(nameOrUsernameOrEmail: string, options?: FindOptions<IUser>): FindCursor<IUser>;
	findCrowdUsers(options?: FindOptions<IUser>): FindCursor<IUser>;
	getLastLogin(options?: FindOptions<IUser>): Promise<Date | undefined>;
	findUsersByUsernames<T = IUser>(usernames: string[], options?: FindOptions<IUser>): FindCursor<T>;
	findUsersByIds(userIds: string[], options?: FindOptions<IUser>): FindCursor<IUser>;
	findUsersWithUsernameByIds(userIds: string[], options?: FindOptions<IUser>): FindCursor<IUser>;
	findUsersWithUsernameByIdsNotOffline(userIds: string[], options?: FindOptions<IUser>): FindCursor<IUser>;
	getOldest(options?: FindOptions<IUser>): Promise<IUser | null>;
	findActiveRemoteUsers(options?: FindOptions<IUser>): FindCursor<IUser>;
	findActiveFederated(options?: FindOptions<IUser>): FindCursor<IUser>;
	getSAMLByIdAndSAMLProvider(userId: string, samlProvider: string): Promise<IUser | null>;
	findBySAMLNameIdOrIdpSession(samlNameId: string, idpSession: string): FindCursor<IUser>;
	findBySAMLInResponseTo(inResponseTo: string): FindCursor<IUser>;
	addImportIds(userId: string, importIds: string | string[]): Promise<UpdateResult>;
	updateInviteToken(userId: string, token: string): Promise<UpdateResult>;
	updateLastLoginById(userId: string): Promise<UpdateResult>;
	addPasswordToHistory(userId: string, password: string, passwordHistoryAmount: number): Promise<UpdateResult>;
	setServiceId(userId: string, serviceName: string, serviceId: string): Promise<UpdateResult>;
	setUsername(userId: string, username: string): Promise<UpdateResult>;
	setEmail(userId: string, email: string): Promise<UpdateResult>;
	setEmailVerified(userId: string, email: string): Promise<UpdateResult>;
	setName(userId: string, name: string): Promise<UpdateResult>;
	unsetName(userId: string): Promise<UpdateResult>;
	setCustomFields(userId: string, customFields: Record<string, unknown>): Promise<UpdateResult>;
	setAvatarData(userId: string, origin: string, etag?: Date | null | string): Promise<UpdateResult>;
	unsetAvatarData(userId: string): Promise<UpdateResult>;
	setUserActive(userId: string, active: boolean): Promise<UpdateResult>;
	setAllUsersActive(active: boolean): Promise<UpdateResult | Document>;
	setActiveNotLoggedInAfterWithRole(latestLastLoginDate: Date, role?: string, active?: boolean): Promise<UpdateResult | Document>;
	unsetRequirePasswordChange(userId: string): Promise<UpdateResult>;
	resetPasswordAndSetRequirePasswordChange(
		userId: string,
		requirePasswordChange: boolean,
		requirePasswordChangeReason: string,
	): Promise<UpdateResult>;
	setLanguage(userId: string, language: string): Promise<UpdateResult>;
	setProfile(userId: string, profile: Record<string, unknown>): Promise<UpdateResult>;
	setBio(userId: string, bio?: string): Promise<UpdateResult>;
	setNickname(userId: string, nickname?: string): Promise<UpdateResult>;
	clearSettings(userId: string): Promise<UpdateResult>;
	setPreferences(userId: string, preferences: Record<string, unknown>): Promise<UpdateResult>;
	setTwoFactorAuthorizationHashAndUntilForUserIdAndToken(userId: string, token: string, hash: string, until: Date): Promise<UpdateResult>;
	setUtcOffset(userId: string, utcOffset: number): Promise<UpdateResult>;
	saveUserById(userId: string, user: Partial<IUser>): Promise<UpdateResult>;
	setReason(userId: string, reason: string): Promise<UpdateResult>;
	unsetReason(userId: string): Promise<UpdateResult>;
	bannerExistsById(userId: string, bannerId: string): Promise<boolean>;
	setBannerReadById(userId: string, bannerId: string): Promise<UpdateResult>;
	removeBannerById(userId: string, bannerId: string): Promise<UpdateResult>;
	removeSamlServiceSession(userId: string): Promise<UpdateResult>;
	updateDefaultStatus(userId: string, status: string): Promise<UpdateResult>;
	setSamlInResponseTo(userId: string, inResponseTo: string): Promise<UpdateResult>;
	create(data: Partial<IUser>): Promise<InsertOneResult<IUser>>;
	removeById(userId: string): Promise<DeleteResult>;
	removeLivechatData(userId: string): Promise<UpdateResult>;
	getUsersToSendOfflineEmail(userIds: string[]): FindCursor<Pick<IUser, 'name' | 'username' | 'emails' | 'settings' | 'language'>>;
	countActiveUsersByService(service: string, options?: FindOptions<IUser>): Promise<number>;
	getActiveLocalUserCount(): Promise<number>;
	getActiveLocalGuestCount(exceptions?: IUser['_id'] | IUser['_id'][]): Promise<number>;
	removeOlderResumeTokensByUserId(userId: string, fromDate: Date): Promise<UpdateResult>;
	findAllUsersWithPendingAvatar(): FindCursor<IUser>;
	updateCustomFieldsById(userId: string, customFields: Record<string, unknown>): Promise<UpdateResult>;
	countRoomMembers(roomId: string): Promise<number>;
	countRemote(options?: FindOptions<IUser>): Promise<number>;
	findOneByImportId(importId: string, options?: FindOptions<IUser>): Promise<IUser | null>;
	removeAgent(_id: string): Promise<UpdateResult>;
	findAgentsWithDepartments<T = ILivechatAgent>(
		role: string,
		query: Filter<IUser>,
		options: FindOptions<IUser>,
	): Promise<{ sortedResults: (T & { departments: string[] })[]; totalCount: { total: number }[] }[]>;
	countByRole(roleName: string): Promise<number>;
	removeEmailCodeOfUserId(userId: string): Promise<UpdateResult>;
	incrementInvalidEmailCodeAttempt(userId: string): Promise<ModifyResult<IUser>>;
}

import type {
	AvailableAgentsAggregation,
	IUser,
	IRole,
	ILivechatAgent,
	UserStatus,
	ILoginToken,
	IPersonalAccessToken,
	AtLeast,
	ILivechatAgentStatus,
	IMeteorLoginToken,
} from '@rocket.chat/core-typings';
import type {
	Document,
	UpdateResult,
	FindCursor,
	FindOptions,
	Filter,
	InsertOneResult,
	DeleteResult,
	WithId,
	UpdateOptions,
	UpdateFilter,
} from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IUsersModel extends IBaseModel<IUser> {
	addRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][]): Promise<UpdateResult>;
	findUsersInRoles(roles: IRole['_id'][] | IRole['_id'], _scope?: null, options?: FindOptions<IUser>): FindCursor<IUser>;
	findPaginatedUsersInRoles(roles: IRole['_id'][] | IRole['_id'], options?: FindOptions<IUser>): FindPaginated<FindCursor<IUser>>;
	findOneByIdWithEmailAddress(uid: IUser['_id'], options?: FindOptions<IUser>): Promise<IUser | null>;
	findOneByUsername<T extends Document = IUser>(username: string, options?: FindOptions<IUser>): Promise<T | null>;
	findOneAgentById<T extends Document = ILivechatAgent>(_id: IUser['_id'], options?: FindOptions<IUser>): Promise<T | null>;
	findUsersInRolesWithQuery(roles: IRole['_id'][] | IRole['_id'], query: Filter<IUser>, options?: FindOptions<IUser>): FindCursor<IUser>;
	findPaginatedUsersInRolesWithQuery<T extends Document = IUser>(
		roles: IRole['_id'][] | IRole['_id'],
		query: Filter<IUser>,
		options?: FindOptions<IUser>,
	): FindPaginated<FindCursor<WithId<T>>>;
	findOneByUsernameAndRoomIgnoringCase(username: string | RegExp, rid: string, options?: FindOptions<IUser>): Promise<IUser | null>;
	findOneByIdAndLoginHashedToken(_id: IUser['_id'], token: string, options?: FindOptions<IUser>): Promise<IUser | null>;
	findByActiveUsersExcept(
		searchTerm: string,
		exceptions: string[],
		options?: FindOptions<IUser>,
		searchFields?: string[],
		extraQuery?: Filter<IUser>[],
		extra?: { startsWith: boolean; endsWith: boolean },
	): FindCursor<IUser>;
	findPaginatedByActiveUsersExcept<T extends Document = IUser>(
		searchTerm: string,
		exceptions?: string[],
		options?: FindOptions<IUser>,
		searchFields?: string[],
		extraQuery?: Filter<IUser>[],
		extra?: { startsWith?: boolean; endsWith?: boolean },
	): FindPaginated<FindCursor<WithId<T>>>;

	findPaginatedByActiveLocalUsersExcept<T extends Document = IUser>(
		searchTerm: string,
		exceptions?: string[],
		options?: FindOptions<IUser>,
		forcedSearchFields?: string[],
		localDomain?: string,
	): FindPaginated<FindCursor<WithId<T>>>;

	findPaginatedByActiveExternalUsersExcept<T extends Document = IUser>(
		searchTerm: string,
		exceptions?: string[],
		options?: FindOptions<IUser>,
		forcedSearchFields?: string[],
		localDomain?: string,
	): FindPaginated<FindCursor<WithId<T>>>;

	findActive(query: Filter<IUser>, options?: FindOptions<IUser>): FindCursor<IUser>;

	findActiveByIds(userIds: IUser['_id'][], options?: FindOptions<IUser>): FindCursor<IUser>;

	findByIds<T extends Document = IUser>(userIds: IUser['_id'][], options?: FindOptions<IUser>): FindCursor<T>;

	findOneByUsernameIgnoringCase<T extends Document = IUser>(username: IUser['username'], options?: FindOptions<IUser>): Promise<T | null>;

	findOneWithoutLDAPByUsernameIgnoringCase<T extends Document = IUser>(username: string, options?: FindOptions<IUser>): Promise<T | null>;

	findOneByLDAPId<T extends Document = IUser>(id: string, attribute?: string): Promise<T | null>;

	findOneByAppId<T extends Document = IUser>(appId: string, options?: FindOptions<IUser>): Promise<T | null>;

	findLDAPUsers<T extends Document = IUser>(options?: FindOptions<IUser>): FindCursor<T>;

	findLDAPUsersExceptIds<T extends Document = IUser>(userIds: IUser['_id'][], options?: FindOptions<IUser>): FindCursor<T>;

	findConnectedLDAPUsers<T extends Document = IUser>(options?: FindOptions<IUser>): FindCursor<T>;

	isUserInRole(userId: IUser['_id'], roleId: IRole['_id']): Promise<Pick<IUser, 'roles' | '_id'> | null>;

	getDistinctFederationDomains(): Promise<string[]>;

	getNextLeastBusyAgent(
		department?: string,
		ignoreAgentId?: string,
		isEnabledWhenAgentIdle?: boolean,
		ignoreUsernames?: string[],
	): Promise<{ agentId: string; username?: string; lastRoutingTime?: Date; count: number }>;
	getLastAvailableAgentRouted(
		department?: string,
		ignoreAgentId?: string,
		isEnabledWhenAgentIdle?: boolean,
		ignoreUsernames?: string[],
	): Promise<{ agentId: string; username?: string; lastRoutingTime?: Date }>;

	setLastRoutingTime(userId: IUser['_id']): Promise<WithId<IUser> | null>;

	setLivechatStatusIf(
		userId: IUser['_id'],
		status: ILivechatAgentStatus,
		conditions?: Filter<IUser>,
		extraFields?: UpdateFilter<IUser>['$set'],
	): Promise<UpdateResult>;
	getAgentAndAmountOngoingChats(
		userId: IUser['_id'],
		departmentId?: string,
	): Promise<{
		agentId: string;
		username?: string;
		lastAssignTime?: Date;
		lastRoutingTime?: Date;
		queueInfo: { chats: number; chatsForDepartment?: number };
	}>;

	findAllResumeTokensByUserId(userId: IUser['_id']): Promise<{ tokens: IMeteorLoginToken[] }[]>;

	findActiveByUsernameOrNameRegexWithExceptionsAndConditions<T extends Document = IUser>(
		termRegex: { $regex: string; $options: string } | RegExp,
		exceptions?: string[],
		conditions?: Filter<IUser>,
		options?: FindOptions<IUser>,
	): FindCursor<T>;

	countAllAgentsStatus({
		departmentId,
	}: {
		departmentId?: string;
	}): Promise<{ offline: number; away: number; busy: number; available: number }[]>;

	getTotalOfRegisteredUsersByDate(params: {
		start: Date;
		end: Date;
		options?: { count?: number; sort?: Record<string, 1 | -1> };
	}): Promise<{ date: string; users: number; type: 'users' }[]>;

	getUserLanguages(): Promise<{ _id: string; total: number }[]>;

	updateStatusText(_id: IUser['_id'], statusText: string, options?: UpdateOptions): Promise<UpdateResult>;

	updateStatusByAppId(appId: string, status: UserStatus): Promise<UpdateResult | Document>;

	openAgentsBusinessHoursByBusinessHourId(businessHourIds: string[]): Promise<Document | UpdateResult>;

	openAgentBusinessHoursByBusinessHourIdsAndAgentId(businessHourIds: string[], agentId: IUser['_id']): Promise<UpdateResult | Document>;

	addBusinessHourByAgentIds(agentIds: string[], businessHourId: string): any;

	removeBusinessHourByAgentIds(agentIds: any, businessHourId: any): any;

	openBusinessHourToAgentsWithoutDepartment(agentIdsWithDepartment: any, businessHourId: any): any;

	closeBusinessHourToAgentsWithoutDepartment(agentIdsWithDepartment: any, businessHourId: any): any;

	closeAgentsBusinessHoursByBusinessHourIds(businessHourIds: any): any;

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

	addBannerById(_id: IUser['_id'], banner: any): Promise<UpdateResult>;

	findOneByAgentUsername(username: any, options: any): any;

	findOneByExtension(extension: any, options?: any): any;

	findByExtensions(extensions: any, options?: any): FindCursor<IUser>;

	getVoipExtensionByUserId(userId: any, options: any): any;

	setExtension(userId: any, extension: any): any;

	unsetExtension(userId: any): any;

	getAvailableAgentsIncludingExt<T extends Document = ILivechatAgent>(
		includeExt?: string,
		text?: string,
		options?: FindOptions<IUser>,
	): FindPaginated<FindCursor<WithId<T>>>;

	findActiveUsersTOTPEnable(options: any): any;

	countActiveUsersTOTPEnable(options: any): Promise<number>;

	findActiveUsersEmail2faEnable(options: any): any;

	countActiveUsersEmail2faEnable(options: any): Promise<number>;

	findActiveByIdsOrUsernames(userIds: IUser['_id'][], options?: FindOptions<IUser>): FindCursor<IUser>;

	setAsFederated(userId: string): any;

	removeRoomByRoomId(rid: any, options?: UpdateOptions): any;

	findOneByResetToken(token: string, options: FindOptions<IUser>): Promise<IUser | null>;

	updateStatusById(
		userId: IUser['_id'],
		{
			statusDefault,
			status,
			statusConnection,
			statusText,
		}: { statusDefault?: UserStatus; status: UserStatus; statusConnection: UserStatus; statusText?: string },
	): Promise<UpdateResult>;

	updateStatusAndStatusDefault(userId: string, status: UserStatus, statusDefault: UserStatus): Promise<UpdateResult>;

	setFederationAvatarUrlById(userId: IUser['_id'], federationAvatarUrl: string): Promise<UpdateResult>;

	setFederationAvatarUrlById(userId: IUser['_id'], federationAvatarUrl: string): Promise<UpdateResult>;

	findSearchedServerNamesByUserId(userId: IUser['_id']): Promise<string[]>;

	addServerNameToSearchedServerNamesList(userId: string, serverName: string): Promise<UpdateResult>;

	removeServerNameFromSearchedServerNamesList(userId: string, serverName: string): Promise<UpdateResult>;

	countFederatedExternalUsers(): Promise<number>;
	findOnlineUserFromList<T extends Document = ILivechatAgent>(
		userList: string | string[],
		isLivechatEnabledWhenAgentIdle?: boolean,
	): FindCursor<T>;
	countOnlineUserFromList(userList: string | string[], isLivechatEnabledWhenAgentIdle?: boolean): Promise<number>;
	getUnavailableAgents(
		departmentId?: string,
		extraQuery?: Filter<AvailableAgentsAggregation>,
	): Promise<Pick<AvailableAgentsAggregation, 'username'>[]>;
	findOneOnlineAgentByUserList(
		userList: string[] | string,
		options?: FindOptions<IUser>,
		isLivechatEnabledWhenAgentIdle?: boolean,
	): Promise<IUser | null>;

	findBotAgents<T extends Document = ILivechatAgent>(usernameList?: string | string[]): FindCursor<T>;
	countBotAgents(usernameList?: string | string[]): Promise<number>;
	removeAllRoomsByUserId(userId: string): Promise<UpdateResult>;
	removeRoomByUserId(userId: string, rid: string): Promise<UpdateResult>;
	addRoomByUserId(userId: string, rid: string): Promise<UpdateResult>;
	addRoomByUserIds(uids: string[], rid: string): Promise<UpdateResult | Document>;
	removeRoomByRoomIds(rids: string[]): Promise<UpdateResult | Document>;
	addRoomRolePriorityByUserId(userId: string, rid: string, rolePriority: number): Promise<UpdateResult>;
	removeRoomRolePriorityByUserId(userId: string, rid: string): Promise<UpdateResult>;
	assignRoomRolePrioritiesByUserIdPriorityMap(rolePrioritiesMap: Record<string, number>, rid: string): Promise<number>;
	unassignRoomRolePrioritiesByRoomId(rid: string): Promise<UpdateResult | Document>;
	getLoginTokensByUserId(userId: string): FindCursor<ILoginToken>;
	addPersonalAccessTokenToUser(data: { userId: string; loginTokenObject: IPersonalAccessToken }): Promise<UpdateResult>;
	removePersonalAccessTokenOfUser(data: {
		userId: string;
		loginTokenObject: AtLeast<IPersonalAccessToken, 'type' | 'name'>;
	}): Promise<UpdateResult>;
	findPersonalAccessTokenByTokenNameAndUserId({ userId, tokenName }: { userId: IUser['_id']; tokenName: string }): Promise<IUser | null>;
	setOperator(userId: string, operator: boolean): Promise<UpdateResult>;
	checkOnlineAgents(agentId?: string, isLivechatEnabledWhenIdle?: boolean): Promise<boolean>;
	findOnlineAgents<T extends Document = ILivechatAgent>(agentId?: IUser['_id'], isLivechatEnabledWhenIdle?: boolean): FindCursor<T>;
	countOnlineAgents(agentId: string): Promise<number>;
	findOneBotAgent<T extends Document = ILivechatAgent>(): Promise<T | null>;
	findOneOnlineAgentById(
		agentId: string,
		isLivechatEnabledWhenAgentIdle?: boolean,
		options?: FindOptions<IUser>,
	): Promise<ILivechatAgent | null>;
	findAgents(): FindCursor<ILivechatAgent>;
	countAgents(): Promise<number>;
	getNextAgent(
		ignoreAgentId?: string,
		extraQuery?: Filter<AvailableAgentsAggregation>,
		enabledWhenAgentIdle?: boolean,
	): Promise<{ agentId: string; username?: string } | null>;
	getNextBotAgent(ignoreAgentId?: string): Promise<{ agentId: string; username?: string } | null>;
	setLivechatStatus(userId: string, status: ILivechatAgentStatus): Promise<UpdateResult>;
	makeAgentUnavailableAndUnsetExtension(userId: string): Promise<UpdateResult>;
	setLivechatData(userId: string, data?: Record<string, any>): Promise<UpdateResult>;
	closeOffice(): Promise<void>;
	openOffice(): Promise<void>;
	getAgentInfo(
		agentId: IUser['_id'],
		showAgentEmail?: boolean,
	): Promise<Pick<ILivechatAgent, '_id' | 'name' | 'username' | 'phone' | 'customFields' | 'status' | 'livechat' | 'emails'> | null>;
	roleBaseQuery(userId: string): { _id: string };
	setE2EPublicAndPrivateKeysByUserId(userId: string, e2e: { public_key: string; private_key: string }): Promise<UpdateResult>;
	rocketMailUnsubscribe(userId: string, createdAt: string): Promise<number>;
	fetchKeysByUserId(userId: string): Promise<{ public_key: string; private_key: string } | object>;
	disable2FAAndSetTempSecretByUserId(userId: string, tempSecret: string): Promise<UpdateResult>;
	enable2FAAndSetSecretAndCodesByUserId(userId: string, secret: string, codes: string[]): Promise<UpdateResult>;
	disable2FAByUserId(userId: string): Promise<UpdateResult>;
	update2FABackupCodesByUserId(userId: string, codes: string[]): Promise<UpdateResult>;
	enableEmail2FAByUserId(userId: string): Promise<UpdateResult>;
	disableEmail2FAByUserId(userId: string): Promise<UpdateResult>;
	findByIdsWithPublicE2EKey(userIds: string[], options?: FindOptions<IUser>): FindCursor<IUser>;
	resetE2EKey(userId: string): Promise<UpdateResult>;
	removeExpiredEmailCodeOfUserId(userId: string): Promise<UpdateResult>;
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
	findOneByRolesAndType<T extends Document = IUser>(roles: IRole['_id'][], type: string, options?: FindOptions<IUser>): Promise<T | null>;
	findNotOfflineByIds(userIds: string[], options?: FindOptions<IUser>): FindCursor<IUser>;
	findUsersNotOffline(options?: FindOptions<IUser>): FindCursor<IUser>;
	countUsersNotOffline(options?: FindOptions<IUser>): Promise<number>;
	findNotIdUpdatedFrom(userId: string, updatedFrom: Date, options?: FindOptions<IUser>): FindCursor<IUser>;
	findByRoomId(roomId: string, options?: FindOptions<IUser>): Promise<FindCursor<IUser>>;
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
	findUsersByUsernames<T extends Document = IUser>(usernames: string[], options?: FindOptions<IUser>): FindCursor<T>;
	findUsersByIds(userIds: string[], options?: FindOptions<IUser>): FindCursor<IUser>;
	findUsersWithUsernameByIds(userIds: string[], options?: FindOptions<IUser>): FindCursor<IUser>;
	findUsersWithUsernameByIdsNotOffline(userIds: string[], options?: FindOptions<IUser>): FindCursor<IUser>;
	getOldest(options?: FindOptions<IUser>): Promise<IUser | null>;
	findActiveFederated(options?: FindOptions<IUser>): FindCursor<IUser>;
	getSAMLByIdAndSAMLProvider(userId: string, samlProvider: string): Promise<IUser | null>;
	findBySAMLNameIdOrIdpSession(samlNameId: string, idpSession: string, options?: FindOptions<IUser>): FindCursor<IUser>;
	findBySAMLInResponseTo(inResponseTo: string, options?: FindOptions<IUser>): FindCursor<IUser>;
	addImportIds(userId: string, importIds: string | string[]): Promise<UpdateResult>;
	updateInviteToken(userId: string, token: string): Promise<UpdateResult>;
	updateLastLoginById(userId: string): Promise<UpdateResult>;
	addPasswordToHistory(userId: string, password: string, passwordHistoryAmount: number): Promise<UpdateResult>;
	setServiceId(userId: string, serviceName: string, serviceId: string): Promise<UpdateResult>;
	setUsername(userId: string, username: string, options?: UpdateOptions): Promise<UpdateResult>;
	setEmail(userId: string, email: string, verified?: boolean, options?: UpdateOptions): Promise<UpdateResult>;
	setEmailVerified(userId: string, email: string): Promise<UpdateResult>;
	setName(userId: string, name: string, options?: UpdateOptions): Promise<UpdateResult>;
	unsetName(userId: string, options?: UpdateOptions): Promise<UpdateResult>;
	setCustomFields(userId: string, customFields: Record<string, unknown>): Promise<UpdateResult>;
	setAvatarData(userId: string, origin: string, etag?: Date | null | string, options?: UpdateOptions): Promise<UpdateResult>;
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
	findOneByImportId<T extends Document = IUser>(_id: IUser['_id'], options?: FindOptions<IUser>): Promise<T | null>;
	removeAgent(_id: string): Promise<UpdateResult>;
	findAgentsWithDepartments<T extends Document = ILivechatAgent>(
		role: IRole['_id'][] | IRole['_id'],
		query: Filter<IUser>,
		options?: FindOptions<IUser>,
	): Promise<{ sortedResults: (T & { departments: string[] })[]; totalCount: { total: number }[] }[]>;
	countByRole(roleName: string): Promise<number>;
	removeEmailCodeOfUserId(userId: string): Promise<UpdateResult>;
	incrementInvalidEmailCodeAttempt(userId: string): Promise<WithId<IUser> | null>;
	findOnlineButNotAvailableAgents<T extends Document = ILivechatAgent>(userIds?: IUser['_id'][]): FindCursor<T>;
	findAgentsAvailableWithoutBusinessHours(userIds?: IUser['_id'][]): FindCursor<Pick<ILivechatAgent, '_id' | 'openBusinessHours'>>;
	updateLivechatStatusByAgentIds(userIds: string[], status: ILivechatAgentStatus): Promise<UpdateResult | Document>;
	findOneByFreeSwitchExtension<T extends Document = IUser>(freeSwitchExtension: string, options?: FindOptions<IUser>): Promise<T | null>;
	findOneByFreeSwitchExtensions<T extends Document = IUser>(
		freeSwitchExtensions: string[],
		options?: FindOptions<IUser>,
	): Promise<T | null>;
	setFreeSwitchExtension(userId: string, extension: string | undefined): Promise<UpdateResult>;
	findAssignedFreeSwitchExtensions(): FindCursor<string | undefined>;
	findUsersWithAssignedFreeSwitchExtensions<T extends Document = IUser>(options?: FindOptions<IUser>): FindCursor<T>;
	countUsersInRoles(roles: IRole['_id'][]): Promise<number>;
	countAllUsersWithPendingAvatar(): Promise<number>;
}

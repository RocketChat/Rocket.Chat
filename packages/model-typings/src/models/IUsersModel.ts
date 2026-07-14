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
	IRoom,
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
	BulkWriteResult,
} from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IUsersModel extends IBaseModel<IUser> {
	addRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][]): Promise<UpdateResult>;
	findUsersInRoles<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roles: IRole['_id'][] | IRole['_id'],
		_scope?: null,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findPaginatedUsersInRoles<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roles: IRole['_id'][] | IRole['_id'],
		options?: O,
	): FindPaginated<FindCursor<DocumentWithProjection<T, O>>>;
	findOneByIdWithEmailAddress<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		uid: IUser['_id'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneByUsername<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		username: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneAgentById<T extends Document = ILivechatAgent, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		_id: IUser['_id'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findUsersInRolesWithQuery<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roles: IRole['_id'][] | IRole['_id'],
		query: Filter<IUser>,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findPaginatedUsersInRolesWithQuery<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roles: IRole['_id'][] | IRole['_id'],
		query: Filter<IUser>,
		options?: O,
	): FindPaginated<FindCursor<DocumentWithProjection<T, O>>>;
	findOneByUsernameAndRoomIgnoringCase<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		username: string | RegExp,
		rid: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneByIdAndLoginHashedToken<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		_id: IUser['_id'],
		token: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findByActiveUsersExcept<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		searchTerm: string,
		exceptions: string[],
		options?: O,
		searchFields?: string[],
		extraQuery?: Filter<IUser>[],
		extra?: { startsWith: boolean; endsWith: boolean },
	): FindCursor<DocumentWithProjection<T, O>>;
	findPaginatedByActiveUsersExcept<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		searchTerm: string,
		exceptions?: string[],
		options?: O,
		searchFields?: string[],
		extraQuery?: Filter<IUser>[],
		extra?: { startsWith?: boolean; endsWith?: boolean },
	): FindPaginated<FindCursor<DocumentWithProjection<T, O>>>;

	findPaginatedByActiveLocalUsersExcept<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		searchTerm: string,
		exceptions?: string[],
		options?: O,
		forcedSearchFields?: string[],
		localDomain?: string,
	): FindPaginated<FindCursor<DocumentWithProjection<T, O>>>;

	findPaginatedByActiveExternalUsersExcept<
		T extends Document = IUser,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		searchTerm: string,
		exceptions?: string[],
		options?: O,
		forcedSearchFields?: string[],
		localDomain?: string,
	): FindPaginated<FindCursor<DocumentWithProjection<T, O>>>;

	findActive<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		query: Filter<IUser>,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findActiveByIds<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userIds: IUser['_id'][],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findByIds<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userIds: IUser['_id'][],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findOneByUsernameIgnoringCase<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		username: IUser['username'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	findOneWithoutLDAPByUsernameIgnoringCase<
		T extends Document = IUser,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		username: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	findOneByLDAPId<T extends Document = IUser>(id: string, attribute?: string): Promise<T | null>;

	findOneByAppId<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		appId: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findUsersByIdentifiers<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		params: { usernames?: string[]; ids?: string[]; emails?: string[]; ldapIds?: string[] },
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findLDAPUsers<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findActiveLDAPUsersExceptIds<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userIds: IUser['_id'][],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findConnectedLDAPUsers<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	isUserInRole(userId: IUser['_id'], roleId: IRole['_id']): Promise<Pick<IUser, 'roles' | '_id'> | null>;

	getNextLeastBusyAgent(
		department?: string,
		ignoreAgentId?: string,
		isEnabledWhenAgentIdle?: boolean,
		ignoreUsernames?: string[],
		acceptChatsWithNoAgents?: boolean,
	): Promise<{ agentId: string; username?: string; lastRoutingTime?: Date; count: number }>;
	getLastAvailableAgentRouted(
		department?: string,
		ignoreAgentId?: string,
		isEnabledWhenAgentIdle?: boolean,
		ignoreUsernames?: string[],
		acceptChatsWithNoAgents?: boolean,
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

	acquireAgentLock(agentId: IUser['_id'], lockTime: Date, lockTimeoutMs?: number): Promise<boolean>;
	releaseAgentLock(agentId: IUser['_id'], lockTime: Date): Promise<boolean>;

	findAllResumeTokensByUserId(userId: IUser['_id']): Promise<{ tokens: IMeteorLoginToken[] }[]>;

	findActiveByUsernameOrNameRegexWithExceptionsAndConditions<
		T extends Document = IUser,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		termRegex: { $regex: string; $options: string } | RegExp,
		exceptions?: string[],
		conditions?: Filter<IUser>,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

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

	setAbacAttributesById(userId: IUser['_id'], attributes: NonNullable<IUser['abacAttributes']>): Promise<IUser | null>;
	unsetAbacAttributesById(userId: IUser['_id']): Promise<IUser | null>;
	findActiveByRoomIds<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roomIds: IRoom['_id'][],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	setCasExternalIdByUsername(username: string): Promise<IUser | null>;

	updateStatusText(_id: IUser['_id'], statusText: string, options?: UpdateOptions): Promise<UpdateResult>;

	findExpiredStatuses(): FindCursor<
		Pick<
			IUser,
			| '_id'
			| 'username'
			| 'type'
			| 'roles'
			| 'status'
			| 'statusDefault'
			| 'statusSource'
			| 'statusText'
			| 'statusExpiresAt'
			| 'statusConnection'
			| 'statusId'
			| 'previousState'
		>
	>;

	findNextStatusExpiration(): Promise<Pick<IUser, '_id' | 'statusExpiresAt'> | null>;

	updatePresenceAndStatus(
		userId: IUser['_id'],
		values: Record<string, unknown>,
		clear?: string[],
		extraFilter?: Filter<IUser>,
	): Promise<IUser | null>;

	updateStatusByAppId(appId: string, status: UserStatus): Promise<UpdateResult | Document>;

	openAgentsBusinessHoursByBusinessHourId(businessHourIds: string[]): Promise<Document | UpdateResult>;

	openAgentBusinessHoursByBusinessHourIdsAndAgentId(businessHourIds: string[], agentId: IUser['_id']): Promise<UpdateResult | Document>;

	addBusinessHourByAgentIds(agentIds: string[], businessHourId: string): any;

	removeBusinessHourByAgentIds(agentIds: any, businessHourId: any): any;

	closeAgentsBusinessHoursByBusinessHourIds(businessHourIds: any): any;

	setLivechatStatusActiveBasedOnBusinessHours(userId: any): any;

	isAgentWithinBusinessHours(agentId: string): Promise<boolean>;

	removeBusinessHoursFromAllUsers(): any;

	resetTOTPById(userId: any): any;

	unsetLoginTokens(userId: any): any;

	unsetOneLoginToken(userId: IUser['_id'], token: string): Promise<UpdateResult>;

	removeNonPATLoginTokensExcept(userId: any, authToken: any): any;

	removeNonLoginTokensExcept(userId: any, authToken: any): any;

	removeRoomsByRoomIdsAndUserId(rids: any, userId: any): any;

	removeRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][]): Promise<UpdateResult>;

	isUserInRoleScope(uid: IUser['_id']): Promise<boolean>;

	addBannerById(_id: IUser['_id'], banner: any): Promise<UpdateResult>;

	countActiveUsersTOTPEnable(options: any): Promise<number>;

	countActiveUsersEmail2faEnable(options: any): Promise<number>;

	findActiveByIdsOrUsernames<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userIds: IUser['_id'][],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	setAsFederated(userId: string): any;

	removeRoomByRoomId(rid: any, options?: UpdateOptions): any;

	updateStatusById(
		userId: IUser['_id'],
		{
			statusDefault,
			status,
			statusConnection,
			statusText,
		}: { statusDefault?: UserStatus; status: UserStatus; statusConnection: UserStatus; statusText?: string },
	): Promise<UpdateResult>;

	countFederatedExternalUsers(): Promise<number>;
	findOnlineUserFromList<T extends Document = ILivechatAgent>(
		userList: string | string[],
		isLivechatEnabledWhenAgentIdle?: boolean,
		acceptChatsWithNoAgents?: boolean,
	): FindCursor<T>;
	getUnavailableAgents(
		departmentId?: string,
		extraQuery?: Filter<AvailableAgentsAggregation>,
		isLivechatEnabledWhenIdle?: boolean,
		acceptChatsWithNoAgents?: boolean,
	): Promise<Pick<AvailableAgentsAggregation, 'username'>[]>;
	findOneOnlineAgentByUserList<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userList: string[] | string,
		options?: O,
		isLivechatEnabledWhenAgentIdle?: boolean,
		acceptChatsWithNoAgents?: boolean,
	): Promise<DocumentWithProjection<T, O> | null>;

	findBotAgents<T extends Document = ILivechatAgent>(usernameList?: string | string[]): FindCursor<T>;
	countBotAgents(usernameList?: string | string[]): Promise<number>;
	removeAllRoomsByUserId(userId: string): Promise<UpdateResult>;
	removeRoomByUserId(userId: string, rid: string): Promise<UpdateResult>;
	addRoomByUserId(userId: string, rid: string): Promise<UpdateResult>;
	addRoomByUserIds(uids: string[], rid: string): Promise<UpdateResult | Document>;
	removeRoomByRoomIds(rids: string[]): Promise<UpdateResult | Document>;
	addRoomRolePriorityByUserId(userId: string, rid: string, rolePriority: number): Promise<UpdateResult>;
	assignRoomRolePrioritiesByUserIdPriorityMap(rolePrioritiesMap: Record<string, number>, rid: string): Promise<number>;
	getLoginTokensByUserId(userId: string): FindCursor<ILoginToken>;
	addPersonalAccessTokenToUser(data: { userId: string; loginTokenObject: IPersonalAccessToken }): Promise<UpdateResult>;
	removePersonalAccessTokenOfUser(data: {
		userId: string;
		loginTokenObject: AtLeast<IPersonalAccessToken, 'type' | 'name'>;
	}): Promise<UpdateResult>;
	findPersonalAccessTokenByTokenNameAndUserId({ userId, tokenName }: { userId: IUser['_id']; tokenName: string }): Promise<IUser | null>;
	findPersonalAccessTokenByHashedTokenAndUserId({
		userId,
		hashedToken,
	}: {
		userId: IUser['_id'];
		hashedToken: string;
	}): Promise<Pick<IUser, '_id'> | null>;
	checkOnlineAgents(agentId?: string, isLivechatEnabledWhenIdle?: boolean, acceptChatsWithNoAgents?: boolean): Promise<boolean>;
	findOnlineAgents<T extends Document = ILivechatAgent>(
		agentId?: IUser['_id'],
		isLivechatEnabledWhenIdle?: boolean,
		acceptChatsWithNoAgents?: boolean,
	): FindCursor<T>;
	findOneOnlineAgentById(
		agentId: string,
		isLivechatEnabledWhenAgentIdle?: boolean,
		acceptChatsWithNoAgents?: boolean,
		options?: FindOptions<IUser>,
	): Promise<ILivechatAgent | null>;
	countAgents(): Promise<number>;
	getNextAgent(
		ignoreAgentId?: string,
		extraQuery?: Filter<AvailableAgentsAggregation>,
		enabledWhenAgentIdle?: boolean,
		acceptChatsWithNoAgents?: boolean,
	): Promise<{ agentId: string; username?: string } | null>;
	getNextBotAgent(ignoreAgentId?: string): Promise<{ agentId: string; username?: string } | null>;
	setLivechatStatus(userId: string, status: ILivechatAgentStatus): Promise<UpdateResult>;
	makeAgentUnavailable(userId: string): Promise<UpdateResult>;
	setLivechatData(userId: string, data?: Record<string, any>): Promise<UpdateResult>;
	getAgentInfo(
		agentId: IUser['_id'],
		showAgentEmail?: boolean,
	): Promise<Pick<ILivechatAgent, '_id' | 'name' | 'username' | 'phone' | 'customFields' | 'status' | 'livechat' | 'emails'> | null>;
	setE2EPublicAndPrivateKeysByUserId(userId: string, e2e: { public_key: string; private_key: string }): Promise<UpdateResult>;
	rocketMailUnsubscribe(userId: string, createdAt: string): Promise<number>;
	fetchKeysByUserId(userId: string): Promise<{ public_key: string; private_key: string } | object>;
	disable2FAAndSetTempSecretByUserId(userId: string, tempSecret: string): Promise<UpdateResult>;
	enable2FAAndSetSecretAndCodesByUserId(userId: string, secret: string, codes: string[]): Promise<UpdateResult>;
	disable2FAByUserId(userId: string): Promise<UpdateResult>;
	update2FABackupCodesByUserId(userId: string, codes: string[]): Promise<UpdateResult>;
	enableEmail2FAByUserId(userId: string): Promise<UpdateResult>;
	disableEmail2FAByUserId(userId: string): Promise<UpdateResult>;
	findByIdsWithPublicE2EKey<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userIds: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	resetE2EKey(userId: string): Promise<UpdateResult>;
	removeExpiredEmailCodeOfUserId(userId: string): Promise<UpdateResult>;
	maxInvalidEmailCodeAttemptsReached(userId: string, maxAttemtps: number): Promise<boolean>;
	addEmailCodeByUserId(userId: string, code: string, expire: Date): Promise<UpdateResult>;
	findActiveUsersInRoles<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roles: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	countActiveUsersInRoles(roles: string[], options?: FindOptions<IUser>): Promise<number>;
	findOneByUsernameAndServiceNameIgnoringCase<
		T extends Document = IUser,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		username: string,
		userId: string,
		serviceName: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneByEmailAddressAndServiceNameIgnoringCase<
		T extends Document = IUser,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		emailAddress: string,
		userId: string,
		serviceName: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneByEmailAddress<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		emailAddress: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneWithoutLDAPByEmailAddress<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		emailAddress: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneAdmin<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneByIdAndLoginToken<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		loginToken: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneActiveById<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneByIdOrUsername<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneByRolesAndType<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roles: IRole['_id'][],
		type: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findWithStatusVisibilityConfig(
		userIds?: string[],
	): FindCursor<Pick<IUser, '_id' | 'username' | 'status' | 'statusText' | 'statusSource' | 'statusExpiresAt' | 'settings'>>;
	findPresenceUsersByIds<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userIds: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findUsersNotOffline<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	countUsersNotOffline(options?: FindOptions<IUser>): Promise<number>;
	findNotIdUpdatedFrom<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		updatedFrom: Date,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByRoomId<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		roomId: string,
		options?: O,
	): Promise<FindCursor<DocumentWithProjection<T, O>>>;
	findByUsernames<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		usernames: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByUsernamesIgnoringCase<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		usernames: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findActiveByUserIds<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userIds: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	countActiveLocalGuests(idsExceptions: string[]): Promise<number>;
	findCrowdUsers<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	getLastLogin(options?: FindOptions<IUser>): Promise<Date | undefined>;
	findUsersByUsernames<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		usernames: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findUsersByIds<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userIds: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	getOldest<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	getSAMLByIdAndSAMLProvider(userId: string, samlProvider: string): Promise<IUser | null>;
	findBySAMLNameIdOrIdpSession<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		samlNameId: string,
		idpSession: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findBySAMLInResponseTo<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		inResponseTo: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
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
	setActiveNotLoggedInAfterWithRole(latestLastLoginDate: Date, role?: string, active?: boolean): Promise<UpdateResult | Document>;
	findActiveNotLoggedInAfterWithRole<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		latestLastLoginDate: Date,
		role?: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
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
	setPhones(userId: string, phones: IUser['phones']): Promise<UpdateResult>;
	clearSettings(userId: string): Promise<UpdateResult>;
	setPreferences(userId: string, preferences: Record<string, unknown>): Promise<UpdateResult>;
	setTwoFactorAuthorizationHashAndUntilForUserIdAndToken(userId: string, token: string, hash: string, until: Date): Promise<UpdateResult>;
	setUtcOffset(userId: string, utcOffset: number): Promise<UpdateResult>;
	setReason(userId: string, reason: string): Promise<UpdateResult>;
	unsetReason(userId: string): Promise<UpdateResult>;
	bannerExistsById(userId: string, bannerId: string): Promise<boolean>;
	setBannerReadById(userId: string, bannerId: string): Promise<UpdateResult>;
	removeBannerById(userId: string, bannerId: string): Promise<UpdateResult>;
	setBannersInBulk(updates: { userId: IUser['_id']; banners: NonNullable<IUser['banners']> }[]): Promise<BulkWriteResult>;
	removeSamlServiceSession(userId: string): Promise<UpdateResult>;
	setSamlInResponseTo(userId: string, inResponseTo: string): Promise<UpdateResult>;
	create(data: Partial<IUser>): Promise<InsertOneResult<IUser>>;
	removeById(userId: string): Promise<DeleteResult>;
	countActiveUsersByService(service: string, options?: FindOptions<IUser>): Promise<number>;
	getActiveLocalUserCount(): Promise<number>;
	getActiveLocalGuestCount(exceptions?: IUser['_id'] | IUser['_id'][]): Promise<number>;
	removeOlderResumeTokensByUserId(userId: string, fromDate: Date): Promise<UpdateResult>;
	findAllUsersWithPendingAvatar(): FindCursor<IUser>;
	updateCustomFieldsById(userId: string, customFields: Record<string, unknown>): Promise<UpdateResult>;
	countRoomMembers(roomId: string): Promise<number>;
	findOneByImportId<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		_id: IUser['_id'],
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
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
	findOneByFreeSwitchExtension<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		freeSwitchExtension: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findByPhone<T extends Document = IUser>(phoneNumber: string, options?: FindOptions<IUser>): FindCursor<T>;
	findAllBySipIdentifiers<T extends Document = IUser>(sipIdentifiers: string[], options?: FindOptions<IUser>): FindCursor<T>;
	countUsersInRoles(roles: IRole['_id'][]): Promise<number>;
	countAllUsersWithPendingAvatar(): Promise<number>;
	findOneByIdAndRole<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: IUser['_id'],
		role: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	countActiveUsersInNonDMRoom(rid: string): Promise<number>;
	countActiveUsersInDMRoom(rid: string): Promise<number>;
	verifyEmailByAddress(_id: IUser['_id'], emailAddress: string): Promise<UpdateResult>;
	findOneByEmailVerificationToken<T extends Document = IUser, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		token: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
}

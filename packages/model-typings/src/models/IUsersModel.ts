import type { Document, UpdateResult, FindCursor, FindOptions, Filter, ModifyResult } from 'mongodb';
import type {
	IUser,
	IRole,
	IRoom,
	ILivechatAgent,
	ILivechatDepartment,
	ILoginToken,
	ILivechatBusinessHour,
	UserStatus,
} from '@rocket.chat/core-typings';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IUsersModel extends IBaseModel<IUser> {
	addRolesByUserId(uid: IUser['_id'], roles: Array<IRole['_id']>): Promise<UpdateResult>;
	findUsersInRoles<T = IUser>(
		roles: Array<IRole['_id']>,
		scope?: IRole['scope'],
		options?: FindOptions<T extends IUser ? IUser : T>,
	): FindCursor<T>;

	findPaginatedUsersInRoles<T = IUser>(
		roles: Array<IRole['_id']>,
		options?: FindOptions<T extends IUser ? IUser : T>,
	): FindPaginated<FindCursor<T>>;

	findOneByUsername<T = IUser>(
		username: NonNullable<IUser['username']>,
		options?: FindOptions<T extends IUser ? IUser : T>,
	): Promise<T | null>;

	findOneAgentById<T = IUser>(
		_id: ILivechatAgent['_id'],
		options?: FindOptions<T extends ILivechatAgent ? ILivechatAgent : T>,
	): Promise<T | null>;

	findUsersInRolesWithQuery<T = IUser>(
		roles: Array<IRole['_id']>,
		query: Filter<IUser>,
		options?: FindOptions<T extends IUser ? IUser : T>,
	): FindCursor<T>;

	findPaginatedUsersInRolesWithQuery<T = IUser>(
		roles: Array<IRole['_id']>,
		query: Filter<IUser>,
		options?: FindOptions<T extends IUser ? IUser : T>,
	): FindPaginated<FindCursor<T>>;

	findOneByUsernameAndRoomIgnoringCase<T = IUser>(
		username: IUser['_id'] | RegExp,
		rid: IRoom['_id'],
		options?: FindOptions<T extends IUser ? IUser : T>,
	): Promise<T | null>;

	findOneByIdAndLoginHashedToken<T = IUser>(
		_id: IUser['_id'],
		token: string,
		options?: FindOptions<T extends IUser ? IUser : T>,
	): Promise<T | null>;

	findByActiveUsersExcept<T = IUser>(
		searchTerm: string,
		exceptions: string | string[],
		options: FindOptions<T extends IUser ? IUser : T>,
		searchFields: any,
		extraQuery: any,
		{ startsWith, endsWith }: { startsWith: boolean; endsWith: boolean },
	): FindCursor<T>;

	findPaginatedByActiveUsersExcept<T = IUser>(
		searchTerm?: string,
		exceptions?: string | string[],
		options?: FindOptions<T extends IUser ? IUser : T>,
		searchFields?: Array<keyof IUser>,
		extraQuery?: Filter<IUser>[],
		{ startsWith, endsWith }?: { startsWith: boolean; endsWith: boolean },
	): FindPaginated<FindCursor<T>>;

	findPaginatedByActiveLocalUsersExcept<T = IUser>(
		searchTerm: string,
		exceptions: string | string[],
		options: FindOptions<T extends IUser ? IUser : T>,
		forcedSearchFields: any,
		localDomain: any,
	): FindPaginated<FindCursor<T>>;

	findPaginatedByActiveExternalUsersExcept<T = IUser>(
		searchTerm: string,
		exceptions: string | string[],
		options: FindOptions<T extends IUser ? IUser : T>,
		forcedSearchFields: any,
		localDomain: any,
	): FindPaginated<FindCursor<T>>;

	findActive<T = IUser>(query: Filter<IUser>, options?: FindOptions<T extends IUser ? IUser : T>): FindCursor<T>;

	findActiveByIds<T = IUser>(userIds: Array<IUser['_id']>, options?: FindOptions<T extends IUser ? IUser : T>): FindCursor<T>;

	findActiveByIdsOrUsernames<T = IUser>(userIds: Array<IUser['_id']>, options?: FindOptions<T extends IUser ? IUser : T>): FindCursor<T>;

	findByIds(userIds: Array<IUser['_id']>): FindCursor<IUser>;
	findByIds(userIds: Array<IUser['_id']>, options?: FindOptions<IUser>): FindCursor<IUser>;
	findByIds<T = IUser>(userIds: Array<IUser['_id']>, options?: FindOptions<T extends IUser ? IUser : T>): FindCursor<T>;

	findOneByUsernameIgnoringCase<T = IUser>(
		username: NonNullable<IUser['username']> | RegExp,
		options?: FindOptions<T extends IUser ? IUser : T>,
	): Promise<T | null>;

	findOneByLDAPId(id: IUser['_id'], attribute: any): Promise<IUser | null>;

	findOneByAppId<T = IUser>(appId: string, options?: FindOptions<T extends IUser ? IUser : T>): Promise<T | null>;

	findLDAPUsers<T = IUser>(option?: FindOptions<T extends IUser ? IUser : T>): FindCursor<T>;

	findConnectedLDAPUsers<T = IUser>(options?: FindOptions<T extends IUser ? IUser : T>): FindCursor<T>;

	isUserInRole(userId: IUser['_id'], roleId: IRole['_id']): Promise<{ roles: IUser['roles'] } | null>;

	getDistinctFederationDomains(): Promise<Array<string>>;

	getNextLeastBusyAgent(
		department: ILivechatDepartment['_id'],
		ignoreAgentId: ILivechatAgent['_id'],
	): Promise<{
		agentId: ILivechatAgent['_id'];
		username: ILivechatAgent['username'];
		lastRoutingTime: ILivechatAgent['lastRoutingTime'];
		departments: ILivechatDepartment['_id'][];
		count: number;
	}>;

	getLastAvailableAgentRouted(
		department: ILivechatDepartment['_id'],
		ignoreAgentId: ILivechatAgent['_id'],
	): Promise<{
		agentId: ILivechatAgent['_id'];
		username: NonNullable<ILivechatAgent['username']>;
		lastRoutingTime: ILivechatAgent['lastRoutingTime'];
		departments: ILivechatDepartment['_id'][];
	}>;

	setLastRoutingTime(userId: ILivechatAgent['_id']): Promise<ModifyResult<IUser>['value']>;

	setLivechatStatusIf(
		userId: ILivechatAgent['_id'],
		status: ILivechatAgent['statusLivechat'],
		conditions: any,
		extraFields: any,
	): Promise<UpdateResult>;

	getAgentAndAmountOngoingChats(userId: ILivechatAgent['_id']): Promise<{
		agentId: ILivechatAgent['_id'];
		username: ILivechatAgent['username'];
		lastAssignTime: ILivechatAgent['lastAssignTime'];
		lastRoutingTime: ILivechatAgent['lastRoutingTime'];
		queueInfo: { chats: number };
	}>;

	findAllResumeTokensByUserId(userId: IUser['_id']): Promise<Array<{ tokens: ILoginToken[] }>>;

	findActiveByUsernameOrNameRegexWithExceptionsAndConditions(
		termRegex: RegExp,
		exceptions: NonNullable<IUser['username'][]>,
		conditions: Filter<IUser>,
	): FindCursor<IUser>;
	findActiveByUsernameOrNameRegexWithExceptionsAndConditions(
		termRegex: RegExp,
		exceptions: NonNullable<IUser['username'][]>,
		conditions: Filter<IUser>,
		options?: FindOptions<IUser>,
	): FindCursor<IUser>;
	findActiveByUsernameOrNameRegexWithExceptionsAndConditions<T = IUser>(
		termRegex: RegExp,
		exceptions: NonNullable<IUser['username'][]>,
		conditions: Filter<IUser>,
		options?: FindOptions<T extends IUser ? IUser : T>,
	): FindCursor<T>;

	countAllAgentsStatus({ departmentId }: { departmentId: ILivechatDepartment['_id'] }): Promise<
		Array<{
			offline: number;
			away: number;
			busy: number;
			available: number;
		}>
	>;

	getTotalOfRegisteredUsersByDate({
		start,
		end,
		options,
	}: {
		start: Date | number;
		end: Date | number;
		options?: {
			sort: NonNullable<FindOptions<IUser>['sort']>;
			count: NonNullable<FindOptions<IUser>['limit']>;
		};
	}): Promise<Array<{ _id: IUser['_id']; date: string; users: number; type: 'users' }>>;

	getUserLanguages(): Promise<Array<{ _id: IUser['language']; total: number }>>;

	updateStatusText(_id: IUser['_id'], statusText: string): Promise<UpdateResult>;

	updateStatusByAppId(appId: string, status: IUser['status']): Promise<Document | UpdateResult>;

	openAgentsBusinessHoursByBusinessHourId(businessHourIds: ILivechatBusinessHour['_id'][]): Promise<Document | UpdateResult>;

	openAgentBusinessHoursByBusinessHourIdsAndAgentId(
		businessHourIds: ILivechatBusinessHour['_id'][],
		agentId: ILivechatAgent['_id'],
	): Promise<Document | UpdateResult>;

	addBusinessHourByAgentIds(
		agentIds: ILivechatAgent['_id'][],
		businessHourId: ILivechatBusinessHour['_id'],
	): Promise<Document | UpdateResult>;

	removeBusinessHourByAgentIds(
		agentIds: ILivechatAgent['_id'][],
		businessHourId: ILivechatBusinessHour['_id'],
	): Promise<Document | UpdateResult>;

	openBusinessHourToAgentsWithoutDepartment(
		agentIdsWithDepartment: ILivechatAgent['_id'][],
		businessHourId: ILivechatBusinessHour['_id'],
	): Promise<Document | UpdateResult>;

	closeBusinessHourToAgentsWithoutDepartment(
		agentIdsWithDepartment: ILivechatAgent['_id'][],
		businessHourId: ILivechatBusinessHour['_id'],
	): Promise<Document | UpdateResult>;

	closeAgentsBusinessHoursByBusinessHourIds(businessHourIds: ILivechatBusinessHour['_id'][]): Promise<Document | UpdateResult>;

	updateLivechatStatusBasedOnBusinessHours(userIds?: IUser['_id'][]): Promise<Document | UpdateResult>;

	setLivechatStatusActiveBasedOnBusinessHours(userId: IUser['_id']): Promise<UpdateResult>;

	isAgentWithinBusinessHours(agentId: ILivechatAgent['_id']): Promise<boolean>;

	removeBusinessHoursFromAllUsers(): Promise<Document | UpdateResult>;

	resetTOTPById(userId: IUser['_id']): Promise<UpdateResult>;

	unsetOneLoginToken(_id: IUser['_id'], token: ILoginToken['hashedToken']): Promise<UpdateResult>;

	unsetLoginTokens(userId: IUser['_id']): Promise<UpdateResult>;

	removeNonPATLoginTokensExcept(userId: IUser['_id'], authToken: ILoginToken['hashedToken']): Promise<UpdateResult>;

	removeRoomsByRoomIdsAndUserId(rids: IRoom['_id'][], userId: IUser['_id']): Promise<UpdateResult | Document>;

	removeRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][]): Promise<UpdateResult>;

	isUserInRoleScope(uid: IUser['_id']): Promise<boolean>;

	// FIXME is IBanner the right one?
	// banner._id ???
	// or am i missign something
	addBannerById(_id: IUser['_id'], banner: any): Promise<UpdateResult>;

	// Voip functions
	findOneByAgentUsername<T = ILivechatAgent>(
		username: ILivechatAgent['username'],
		options?: FindOptions<T extends ILivechatAgent ? ILivechatAgent : T>,
	): Promise<T | null>;

	findOneByExtension(extension: ILivechatAgent['extension']): Promise<ILivechatAgent | null>;
	findOneByExtension(extension: ILivechatAgent['extension'], options?: FindOptions<ILivechatAgent>): Promise<ILivechatAgent | null>;
	findOneByExtension<T = ILivechatAgent>(
		extension: ILivechatAgent['extension'],
		options?: FindOptions<T extends ILivechatAgent ? ILivechatAgent : T>,
	): Promise<T | null>;

	findByExtensions(extensions: NonNullable<ILivechatAgent['extension']>[]): FindCursor<ILivechatAgent>;
	findByExtensions(
		extensions: NonNullable<ILivechatAgent['extension']>[],
		options?: FindOptions<ILivechatAgent>,
	): FindCursor<ILivechatAgent>;
	findByExtensions<T = ILivechatAgent>(
		extensions: NonNullable<ILivechatAgent['extension']>[],
		options?: FindOptions<T extends ILivechatAgent ? ILivechatAgent : T>,
	): FindCursor<T>;

	getVoipExtensionByUserId<T = ILivechatAgent>(
		userId: ILivechatAgent['_id'],
		options?: FindOptions<T extends ILivechatAgent ? ILivechatAgent : T>,
	): Promise<T | null>;

	setExtension(userId: ILivechatAgent['_id'], extension: ILivechatAgent['extension']): Promise<UpdateResult>;

	unsetExtension(userId: ILivechatAgent['_id']): Promise<UpdateResult>;

	getAvailableAgentsIncludingExt<T = ILivechatAgent>(
		includeExt?: ILivechatAgent['extension'],
		text?: string,
		options?: FindOptions<T extends ILivechatAgent ? ILivechatAgent : T>,
	): FindPaginated<FindCursor<T>>;

	findActiveUsersTOTPEnable<T = IUser>(options?: FindOptions<T extends IUser ? IUser : T>): FindCursor<T>;

	findActiveUsersEmail2faEnable<T = IUser>(options?: FindOptions<T extends IUser ? IUser : T>): FindCursor<T>;

	setAsFederated(uid: IUser['_id']): Promise<UpdateResult>;

	removeRoomByRoomId(rid: IRoom['_id']): Promise<UpdateResult | Document>;

	findOneByResetToken<T = IUser>(token: ILoginToken['hashedToken'], options?: FindOptions<T extends IUser ? IUser : T>): Promise<T | null>;

	updateStatusById(
		userId: string,
		{
			statusDefault,
			status,
			statusConnection,
			statusText,
		}: { statusDefault?: string; status: UserStatus; statusConnection: UserStatus; statusText?: string },
	): Promise<UpdateResult>;

	setFederationAvatarUrlById(userId: IUser['_id'], federationAvatarUrl: string): Promise<UpdateResult>;
}

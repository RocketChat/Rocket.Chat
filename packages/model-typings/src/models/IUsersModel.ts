import type { Document, UpdateResult, FindCursor, FindOptions } from 'mongodb';
import type { IUser, IRole, IRoom, ILivechatAgent, UserStatus } from '@rocket.chat/core-typings';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IUsersModel extends IBaseModel<IUser> {
	addRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][]): Promise<UpdateResult>;
	findUsersInRoles<T = IUser>(roles: IRole['_id'][], scope?: null, options?: any): FindCursor<T>;
	findPaginatedUsersInRoles<T = IUser>(roles: IRole['_id'][], options?: any): FindPaginated<FindCursor<T>>;
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

	findOneByUsernameIgnoringCase<T = IUser>(username: any, options: any): Promise<T>;

	findOneByLDAPId<T = IUser>(id: any, attribute?: any): Promise<T>;

	findOneByAppId<T = IUser>(appId: string, options?: FindOptions<IUser>): Promise<T | null>;

	findLDAPUsers<T = IUser>(options?: any): FindCursor<T>;

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

	setLivechatStatusIf(userId: any, status: any, conditions?: any, extraFields?: any): Promise<UpdateResult>;
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

	openAgentBusinessHoursByBusinessHourIdsAndAgentId(businessHourIds: any, agentId: any): any;

	addBusinessHourByAgentIds(agentIds: any, businessHourId: any): any;

	removeBusinessHourByAgentIds(agentIds: any, businessHourId: any): any;

	openBusinessHourToAgentsWithoutDepartment(agentIdsWithDepartment: any, businessHourId: any): any;

	closeBusinessHourToAgentsWithoutDepartment(agentIdsWithDepartment: any, businessHourId: any): any;

	closeAgentsBusinessHoursByBusinessHourIds(businessHourIds: any): any;

	updateLivechatStatusBasedOnBusinessHours(userIds?: any): any;

	setLivechatStatusActiveBasedOnBusinessHours(userId: any): any;

	isAgentWithinBusinessHours(agentId: any): Promise<any>;

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

	findActiveUsersEmail2faEnable(options: any): any;

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
}

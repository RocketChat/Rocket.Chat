import type { Document, UpdateResult, FindCursor, FindOptions } from 'mongodb';
import type { IUser, IRole, IRoom, ILivechatAgent } from '@rocket.chat/core-typings';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IUsersModel extends IBaseModel<IUser> {
	addRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][]): Promise<UpdateResult>;
	findUsersInRoles(roles: IRole['_id'][], scope?: null, options?: any): FindCursor<IUser>;
	findPaginatedUsersInRoles(roles: IRole['_id'][], options?: any): FindPaginated<FindCursor<IUser>>;
	findOneByUsername(username: string, options?: any): Promise<IUser>;
	findOneAgentById(_id: string, options: any): Promise<ILivechatAgent>;
	findUsersInRolesWithQuery(roles: IRole['_id'] | IRole['_id'][], query: any, options: any): any;
	findPaginatedUsersInRolesWithQuery(roles: IRole['_id'] | IRole['_id'][], query: any, options: any): any;
	findOneByUsernameAndRoomIgnoringCase(username: string, rid: IRoom['_id'], options: any): any;
	findOneByIdAndLoginHashedToken(_id: string, token: any, options?: any): any;
	findByActiveUsersExcept(
		searchTerm: any,
		exceptions: any,
		options: any,
		searchFields: any,
		extraQuery?: any,
		params?: { startsWith?: boolean; endsWith?: boolean },
	): any;
	findPaginatedByActiveUsersExcept(
		searchTerm: any,
		exceptions: any,
		options: any,
		searchFields: any,
		extraQuery?: any,
		params?: { startsWith?: boolean; endsWith?: boolean },
	): any;

	findPaginatedByActiveLocalUsersExcept(searchTerm: any, exceptions: any, options: any, forcedSearchFields: any, localDomain: any): any;

	findPaginatedByActiveExternalUsersExcept(searchTerm: any, exceptions: any, options: any, forcedSearchFields: any, localDomain: any): any;

	findActive(options?: any): FindCursor<IUser>;

	findActiveByIds(userIds: any, options?: any): FindCursor<IUser>;

	findByIds(userIds: any, options?: any): FindCursor<IUser>;

	findOneByUsernameIgnoringCase(username: any, options: any): any;

	findOneByLDAPId(id: any, attribute?: any): Promise<any>;

	findOneByAppId(appId: string, options?: FindOptions<IUser>): Promise<IUser | null>;

	findLDAPUsers(options?: any): any;

	findConnectedLDAPUsers(options?: any): any;

	isUserInRole(userId: IUser['_id'], roleId: IRole['_id']): Promise<boolean>;

	getDistinctFederationDomains(): any;

	getNextLeastBusyAgent(department: any, ignoreAgentId: any): Promise<any>;

	getLastAvailableAgentRouted(department: any, ignoreAgentId: any): Promise<any>;

	setLastRoutingTime(userId: any): Promise<any>;

	setLivechatStatusIf(userId: any, status: any, conditions?: any, extraFields?: any): any;

	getAgentAndAmountOngoingChats(userId: any): Promise<any>;

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
}

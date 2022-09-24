import type { Document, UpdateResult, FindCursor, FindOptions, WithId, Filter, ModifyResult, Collection } from 'mongodb';
import type {
  IUser,
  IRole,
  IRoom,
  ILivechatAgent,
  ILivechatDepartment,
  ILoginToken,
  ILivechatBusinessHour,
} from '@rocket.chat/core-typings';

import type { FindPaginated, IBaseModel } from './IBaseModel';

type AggregationLimitStage<T> = Parameters<ReturnType<Collection<T>['aggregate']>['limit']>[0];
type AggregationSortStage<T> = Parameters<ReturnType<Collection<T>['aggregate']>['sort']>[0];

export interface IUsersModel extends IBaseModel<IUser> {
  addRolesByUserId(uid: IUser['_id'], roles: Array<IRole['_id']>): Promise<UpdateResult>;

  /**
   * @param {IRole['_id'][]} roles list of role ids
   * @param {null} scope the value for the role scope (room id) - not used in the users collection
   * @param {any} options
   */
  // DONE
  findUsersInRoles<T>(
    roles: Array<IRole['_id']>,
    _scope?: IRole['scope'],
    options?: FindOptions<T extends IUser ? IUser : T>,
  ): FindCursor<T | IUser>;

  findPaginatedUsersInRoles<T>(
    roles: Array<IRole['_id']>,
    options?: FindOptions<T extends IUser ? IUser : T>,
  ): FindPaginated<FindCursor<WithId<T>>> | FindPaginated<FindCursor<WithId<IUser>>>;

  findOneByUsername<T>(
    username: NonNullable<IUser['username']>,
    options?: FindOptions<T extends IUser ? IUser : T>,
  ): Promise<T | IUser | null>;

  findOneAgentById<T>(
    _id: ILivechatAgent['_id'],
    options: FindOptions<T extends ILivechatAgent ? ILivechatAgent : T>,
  ): Promise<T | ILivechatAgent | null>;

  /**
   * @param {IRole['_id'][] | IRole['_id']} roles the list of role ids
   * @param {any} query
   * @param {any} options
   */
  findUsersInRolesWithQuery<T>(
    roles: Array<IRole['_id']>,
    query: Filter<IUser>,
    options: FindOptions<T extends IUser ? IUser : T>,
  ): FindCursor<T | IUser>;

  /**
   * @param {IRole['_id'][] | IRole['_id']} roles the list of role ids
   * @param {any} query
   * @param {any} options
   */
  findPaginatedUsersInRolesWithQuery<T>(
    roles: Array<IRole['_id']>,
    query: Filter<IUser>,
    options: FindOptions<T extends IUser ? IUser : T>,
  ): FindPaginated<FindCursor<WithId<T>>> | FindPaginated<FindCursor<WithId<IUser>>>;

  findOneByUsernameAndRoomIgnoringCase<T>(
    username: IUser['_id'] | RegExp,
    rid: IRoom['_id'],
    options: FindOptions<T extends IUser ? IUser : T>,
  ): Promise<T | IUser | null>;

  findOneByIdAndLoginHashedToken<T>(
    _id: IUser['_id'],
    token: string,
    options: FindOptions<T extends IUser ? IUser : T>,
  ): Promise<T | IUser | null>;

  findByActiveUsersExcept<T>(
    searchTerm: string,
    exceptions: string | string[],
    options: FindOptions<T extends IUser ? IUser : T>,
    searchFields: any,
    extraQuery: any,
    { startsWith, endsWith }: { startsWith: boolean; endsWith: boolean },
  ): FindCursor<T | IUser>;

  findPaginatedByActiveUsersExcept<T>(
    searchTerm: string,
    exceptions: string | string[],
    options: FindOptions<T extends IUser ? IUser : T>,
    searchFields: any,
    extraQuery: Filter<IUser>[],
    { startsWith, endsWith }: { startsWith: boolean; endsWith: boolean },
  ): FindPaginated<FindCursor<WithId<T>>> | FindPaginated<FindCursor<WithId<IUser>>>;

  findPaginatedByActiveLocalUsersExcept<T>(
    searchTerm: string,
    exceptions: string | string[],
    options: FindOptions<T extends IUser ? IUser : T>,
    forcedSearchFields: any,
    localDomain: any,
  ): FindPaginated<FindCursor<WithId<T>>> | FindPaginated<FindCursor<WithId<IUser>>>;

  findPaginatedByActiveExternalUsersExcept<T>(
    searchTerm: string,
    exceptions: string | string[],
    options: FindOptions<T extends IUser ? IUser : T>,
    forcedSearchFields: any,
    localDomain: any,
  ): FindPaginated<FindCursor<WithId<T>>> | FindPaginated<FindCursor<WithId<IUser>>>;

  findActive<T>(query: Filter<IUser>, options: FindOptions<T extends IUser ? IUser : T>): FindCursor<T | IUser>;

  findActiveByIds<T>(userIds: Array<IUser['_id']>, options: FindOptions<T extends IUser ? IUser : T>): FindCursor<T | IUser>;

  findActiveByIdsOrUsernames<T>(userIds: Array<IUser['_id']>, options: FindOptions<T extends IUser ? IUser : T>): FindCursor<T | IUser>;

  findByIds<T>(userIds: Array<IUser['_id']>, options: FindOptions<T extends IUser ? IUser : T>): FindCursor<T | IUser>;

  findOneByUsernameIgnoringCase<T>(
    username: NonNullable<IUser['username']> | RegExp,
    options: FindOptions<T extends IUser ? IUser : T>,
  ): Promise<T | IUser | null>;

  findOneByLDAPId(id: IUser['_id'], attribute: any): Promise<IUser | null>;

  findOneByAppId<T>(appId: string, options: FindOptions<T extends IUser ? IUser : T>): Promise<T | IUser | null>;

  findLDAPUsers<T>(options: FindOptions<T extends IUser ? IUser : T>): FindCursor<T | IUser>;

  findConnectedLDAPUsers<T>(options: FindOptions<T extends IUser ? IUser : T>): FindCursor<T | IUser>;

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
    username: ILivechatAgent['username'];
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
    'agentId': ILivechatAgent['_id'];
    'username': ILivechatAgent['username'];
    'lastAssignTime': ILivechatAgent['lastAssignTime'];
    'lastRoutingTime': ILivechatAgent['lastRoutingTime'];
    'queueInfo.chats': number;
  }>;

  findAllResumeTokensByUserId(userId: IUser['_id']): Promise<Array<{ tokens: ILoginToken[] }>>;

  findActiveByUsernameOrNameRegexWithExceptionsAndConditions<T>(
    termRegex: RegExp,
    exceptions: NonNullable<IUser['username'][]>,
    conditions: Filter<IUser>,
    options: FindOptions<T extends IUser ? IUser : T>,
  ): FindCursor<T | IUser>;

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
    start: Date;
    end: Date;
    options: {
      sort: AggregationSortStage<IUser>;
      count: AggregationLimitStage<IUser>;
    };
  }): Promise<
    Array<{
      _id: IUser['_id'];
      date: Date;
      users: number;
      type: 'users';
    }>
  >;

  getUserLanguages(): Promise<
    Array<{
      _id: IUser['language'];
      total: number;
    }>
  >;

  updateStatusText(_id: IUser['_id'], statusText: string): Promise<UpdateResult>;

  updateStatusByAppId(appId: string, status: IUser['status']): Promise<Document | UpdateResult>;

  updateStatusById(
    userId: IUser['_id'],
    {
      status,
      statusConnection,
      statusDefault,
      statusText,
    }: {
      status: IUser['status'];
      statusConnection: IUser['statusConnection'];
      statusDefault?: IUser['statusDefault'];
      statusText?: IUser['statusText'];
    },
  ): Promise<UpdateResult>;

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

  updateLivechatStatusBasedOnBusinessHours(userIds: IUser['_id'][]): Promise<Document | UpdateResult>;

  setLivechatStatusActiveBasedOnBusinessHours(userId: IUser['_id']): Promise<UpdateResult>;

  isAgentWithinBusinessHours(agentId: ILivechatAgent['_id']): Promise<boolean>;

  removeBusinessHoursFromAllUsers(): Promise<Document | UpdateResult>;

  resetTOTPById(userId: IUser['_id']): Promise<UpdateResult>;

  unsetOneLoginToken(_id: IUser['_id'], token: ILoginToken): Promise<UpdateResult>;

  unsetLoginTokens(userId: IUser['_id']): Promise<UpdateResult>;

  removeNonPATLoginTokensExcept(userId: IUser['_id'], authToken: ILoginToken): Promise<UpdateResult>;

  removeRoomsByRoomIdsAndUserId(rids: IRoom['_id'][], userId: IUser['_id']): Promise<UpdateResult | Document>;

  /**
   * @param {string} uid
   * @param {IRole['_id']} roles the list of role ids to remove
   */
  removeRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][]): Promise<UpdateResult>;

  isUserInRoleScope(uid: IUser['_id']): Promise<boolean>;

  // FIXME is IBanner the right one?
  // banner._id ???
  // or am i missign something
  addBannerById(_id: IUser['_id'], banner: any): Promise<UpdateResult>;

  // Voip functions
  findOneByAgentUsername<T>(
    username: ILivechatAgent['username'],
    options: FindOptions<T extends ILivechatAgent ? ILivechatAgent : T>,
  ): Promise<T | ILivechatAgent | null>;

  findOneByExtension(extension: ILivechatAgent['extension']): Promise<ILivechatAgent | null>;
  findOneByExtension(extension: ILivechatAgent['extension'], options?: FindOptions<ILivechatAgent>): Promise<ILivechatAgent | null>;
  findOneByExtension<T>(
    extension: ILivechatAgent['extension'],
    options: FindOptions<T extends ILivechatAgent ? ILivechatAgent : T>,
  ): Promise<T | ILivechatAgent | null>;

  findByExtensions(extensions: NonNullable<ILivechatAgent['extension']>[]): FindCursor<ILivechatAgent>;
  findByExtensions(
    extensions: NonNullable<ILivechatAgent['extension']>[],
    options?: FindOptions<ILivechatAgent>,
  ): FindCursor<ILivechatAgent>;
  findByExtensions<T>(
    extensions: NonNullable<ILivechatAgent['extension']>[],
    options?: FindOptions<T extends ILivechatAgent ? ILivechatAgent : T>,
  ): FindCursor<T | ILivechatAgent>;

  getVoipExtensionByUserId<T>(
    userId: ILivechatAgent['_id'],
    options: FindOptions<T extends ILivechatAgent ? ILivechatAgent : T>,
  ): Promise<T | ILivechatAgent | null>;

  setExtension(userId: ILivechatAgent['_id'], extension: ILivechatAgent['extension']): Promise<UpdateResult>;

  unsetExtension(userId: ILivechatAgent['_id']): Promise<UpdateResult>;

  getAvailableAgentsIncludingExt<T>(
    includeExt: ILivechatAgent['extension'],
    text: string,
    options: FindOptions<T extends ILivechatAgent ? ILivechatAgent : T>,
  ): FindPaginated<FindCursor<WithId<T>>> | FindPaginated<FindCursor<WithId<ILivechatAgent>>>;

  findActiveUsersTOTPEnable<T>(options: FindOptions<T extends IUser ? IUser : T>): FindCursor<T | IUser>;

  findActiveUsersEmail2faEnable<T>(options: FindOptions<T extends IUser ? IUser : T>): FindCursor<T | IUser>;

  setAsFederated(uid: IUser['_id']): Promise<UpdateResult>;

  removeRoomByRoomId(rid: IRoom['_id']): Promise<UpdateResult | Document>;

  findOneByResetToken<T>(token: ILoginToken, options: FindOptions<T extends IUser ? IUser : T>): Promise<T | IUser | null>;
}

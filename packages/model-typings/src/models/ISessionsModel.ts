import type {
	ISession,
	UserSessionAggregationResult,
	DeviceSessionAggregationResult,
	OSSessionAggregationResult,
	IUser,
	DeviceManagementPopulatedSession,
	DeviceManagementSession,
} from '@rocket.chat/core-typings';
import type { BulkWriteResult, Document, FindOptions, UpdateResult, FindCursor, OptionalId } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export type DestructuredDate = { year: number; month: number; day: number };
export type DestructuredDateWithType = {
	year: number;
	month: number;
	day: number;
	type?: 'month' | 'week';
};
export type DestructuredRange = { start: DestructuredDate; end: DestructuredDate };
export type DateRange = { start: Date; end: Date };

type CustomSortOp = 'loginAt' | 'device.name' | 'device.os.name';
type CustomSortOpAdmin = CustomSortOp | '_user.username' | '_user.name';

export interface ISessionsModel extends IBaseModel<ISession> {
	aggregateSessionsAndPopulate({
		sort,
		search,
		offset,
		count,
	}: {
		sort?: Record<CustomSortOpAdmin, 1 | -1>;
		search?: string | null;
		offset?: number;
		count?: number;
	}): Promise<{ sessions: Array<DeviceManagementPopulatedSession>; count: number; offset: number; total: number }>;

	aggregateSessionsByUserId({
		uid,
		sort,
		search,
		offset,
		count,
	}: {
		uid: string;
		sort?: Record<CustomSortOp, 1 | -1>;
		search?: string | null;
		offset?: number;
		count?: number;
	}): Promise<{ sessions: Array<DeviceManagementSession>; count: number; offset: number; total: number }>;

	getActiveUsersBetweenDates({ start, end }: DestructuredRange): Promise<ISession[]>;
	findLastLoginByIp(ip: string): Promise<ISession | null>;
	findOneBySessionId(sessionId: string): Promise<ISession | null>;
	findOneBySessionIdAndUserId(sessionId: string, userId: string): Promise<ISession | null>;

	findSessionsNotClosedByDateWithoutLastActivity({ year, month, day }: DestructuredDate): FindCursor<ISession>;
	getActiveUsersOfPeriodByDayBetweenDates({ start, end }: DestructuredRange): Promise<
		{
			day: number;
			month: number;
			year: number;
			usersList: IUser['_id'][];
			users: number;
		}[]
	>;

	getBusiestTimeWithinHoursPeriod({ start, end, groupSize }: DateRange & { groupSize: number }): Promise<
		{
			hour: number;
			users: number;
		}[]
	>;

	getTotalOfSessionsByDayBetweenDates({ start, end }: DestructuredRange): Promise<
		{
			day: number;
			month: number;
			year: number;
			users: number;
		}[]
	>;

	getTotalOfSessionByHourAndDayBetweenDates({ start, end }: DateRange): Promise<
		{
			hour: number;
			day: number;
			month: number;
			year: number;
			users: number;
		}[]
	>;

	getUniqueUsersOfYesterday(): Promise<UserSessionAggregationResult>;

	getUniqueUsersOfLastMonth(): Promise<UserSessionAggregationResult>;

	getUniqueUsersOfLastWeek(): Promise<UserSessionAggregationResult>;

	getUniqueDevicesOfYesterday(): Promise<DeviceSessionAggregationResult>;

	getUniqueDevicesOfLastMonth(): Promise<DeviceSessionAggregationResult>;

	getUniqueDevicesOfLastWeek(): Promise<DeviceSessionAggregationResult>;

	getUniqueOSOfYesterday(): Promise<OSSessionAggregationResult>;

	getUniqueOSOfLastMonth(): Promise<OSSessionAggregationResult>;

	getUniqueOSOfLastWeek(): Promise<OSSessionAggregationResult>;

	createOrUpdate(data: Omit<ISession, '_id' | 'createdAt' | '_updatedAt'>): Promise<UpdateResult | undefined>;

	closeByInstanceIdAndSessionId(instanceId: string, sessionId: string): Promise<UpdateResult>;

	updateActiveSessionsByDateAndInstanceIdAndIds(
		params: Partial<DestructuredDate>,
		instanceId: string,
		sessions: string[],
		data: Record<string, any>,
	): Promise<UpdateResult | Document>;

	updateActiveSessionsByDate({ year, month, day }: DestructuredDate, data: Record<string, any>): Promise<UpdateResult | Document>;

	logoutByInstanceIdAndSessionIdAndUserId(instanceId: string, sessionId: string, userId: string): Promise<UpdateResult>;

	logoutBySessionIdAndUserId({
		loginToken,
		userId,
	}: {
		loginToken: ISession['loginToken'];
		userId: IUser['_id'];
	}): Promise<UpdateResult | Document>;

	logoutByloginTokenAndUserId({
		loginToken,
		userId,
		logoutBy,
	}: {
		loginToken: ISession['loginToken'];
		userId: IUser['_id'];
		logoutBy?: IUser['_id'];
	}): Promise<UpdateResult | Document>;

	createBatch(sessions: OptionalId<ISession>[]): Promise<BulkWriteResult | undefined>;

	updateDailySessionById(_id: ISession['_id'], record: Partial<ISession>): Promise<UpdateResult>;

	updateAllSessionsByDateToComputed({ start, end }: DestructuredRange): Promise<UpdateResult | Document>;

	getLoggedInByUserIdAndSessionId<T extends Document = ISession>(
		userId: string,
		sessionId: string,
		options?: FindOptions<T>,
	): Promise<T | null>;
}

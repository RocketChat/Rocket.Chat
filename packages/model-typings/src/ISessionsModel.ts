import type { BulkWriteOpResultObject, UpdateWriteOpResult, Cursor } from 'mongodb';
import type {
	ISession,
	UserSessionAggregationResult,
	DeviceSessionAggregationResult,
	OSSessionAggregationResult,
	IUser,
} from '@rocket.chat/core-typings';

import type { IBaseModel, ModelOptionalId } from './IBaseModel';

export type DestructuredDate = { year: number; month: number; day: number };
export type DestructuredDateWithType = {
	year: number;
	month: number;
	day: number;
	type?: 'month' | 'week';
};
export type DestructuredRange = { start: DestructuredDate; end: DestructuredDate };
export type DateRange = { start: Date; end: Date };

export interface ISessionsModel extends IBaseModel<ISession> {
	getActiveUsersBetweenDates({ start, end }: DestructuredRange): Promise<ISession[]>;
	findLastLoginByIp(ip: string): Promise<ISession | null>;
	findOneBySessionId(sessionId: string): Promise<ISession | null>;

	findSessionsNotClosedByDateWithoutLastActivity({ year, month, day }: DestructuredDate): Cursor<ISession>;
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

	createOrUpdate(data: Omit<ISession, '_id' | 'createdAt' | '_updatedAt'>): Promise<UpdateWriteOpResult | undefined>;

	closeByInstanceIdAndSessionId(instanceId: string, sessionId: string): Promise<UpdateWriteOpResult>;

	updateActiveSessionsByDateAndInstanceIdAndIds(
		params: Partial<DestructuredDate>,
		instanceId: string,
		sessions: string[],
		data?: Record<string, any>,
	): Promise<UpdateWriteOpResult>;

	updateActiveSessionsByDate({ year, month, day }: DestructuredDate, data?: Record<string, any>): Promise<UpdateWriteOpResult>;

	logoutByInstanceIdAndSessionIdAndUserId(instanceId: string, sessionId: string, userId: string): Promise<UpdateWriteOpResult>;

	createBatch(sessions: ModelOptionalId<ISession>[]): Promise<BulkWriteOpResultObject | undefined>;
}

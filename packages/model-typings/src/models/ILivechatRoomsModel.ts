import type {
	IMessage,
	IOmnichannelRoom,
	IOmnichannelRoomClosingInfo,
	ILivechatVisitor,
	MACStats,
	ILivechatContactVisitorAssociation,
	AtLeast,
	ILivechatContact,
} from '@rocket.chat/core-typings';
import type { FindCursor, UpdateResult, AggregationCursor, Document, FindOptions, DeleteResult, Filter, UpdateOptions } from 'mongodb';

import type { FindPaginated } from '..';
import type { Updater } from '../updater';
import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

type Period = {
	start: any;
	end: any;
};

type WithDepartment = {
	departmentId: any;
};

type WithOnlyCount = {
	onlyCount?: boolean;
};

type WithOptions = {
	options?: any;
};

// TODO: Fix types of model
export interface ILivechatRoomsModel extends IBaseModel<IOmnichannelRoom> {
	getUpdater(): Updater<IOmnichannelRoom>;

	getQueueMetrics(params: { departmentId: any; agentId: any; includeOfflineAgents: any; options?: any }): any;

	findAllNumberOfAbandonedRooms(
		params: Period & WithDepartment & WithOnlyCount & WithOptions & { inactivityTimeout: number },
	): Promise<any>;

	findPercentageOfAbandonedRooms(
		params: Period & WithDepartment & WithOnlyCount & WithOptions & { inactivityTimeout: number },
	): Promise<any>;

	findAllAverageOfChatDurationTime(params: Period & WithDepartment & WithOnlyCount & WithOptions): any;

	findAllAverageWaitingTime(params: Period & WithDepartment & WithOnlyCount & WithOptions): any;

	findAllRooms(params: Period & WithDepartment & WithOnlyCount & WithOptions & { answered: any }): any;

	findAllServiceTime(params: Period & WithDepartment & WithOnlyCount & WithOptions): any;

	findAllNumberOfTransferredRooms(params: Period & WithDepartment & WithOptions): any;

	countAllOpenChatsBetweenDate(params: Period & WithDepartment): any;

	countAllClosedChatsBetweenDate(params: Period & WithDepartment): any;

	countAllQueuedChatsBetweenDate(params: Period & WithDepartment): any;

	countAllOpenChatsByAgentBetweenDate(params: Period & WithDepartment): any;

	countAllOnHoldChatsByAgentBetweenDate(params: Period & WithDepartment): any;

	countAllClosedChatsByAgentBetweenDate(params: Period & WithDepartment): any;

	countAllOpenChatsByDepartmentBetweenDate(params: Period & WithDepartment): any;

	countAllClosedChatsByDepartmentBetweenDate(params: Period & WithDepartment): any;

	calculateResponseTimingsBetweenDates(params: Period & WithDepartment): any;

	calculateReactionTimingsBetweenDates(params: Period & WithDepartment): any;

	calculateDurationTimingsBetweenDates(params: Period & WithDepartment): any;

	findAllAverageOfServiceTime(params: Period & WithDepartment & WithOnlyCount & WithOptions): any;

	findByVisitorId(visitorId: any, options: any, extraQuery?: any): any;

	findPaginatedByVisitorId(visitorId: any, options: any, extraQuery?: any): any;

	findRoomsByVisitorIdAndMessageWithCriteria(params: {
		visitorId: any;
		searchText: any;
		open: any;
		served: any;
		onlyCount?: boolean;
		options?: any;
		source?: string;
	}): any;

	findRoomsWithCriteria(params: {
		agents: any;
		roomName: any;
		departmentId: any;
		open: any;
		served?: any;
		createdAt: any;
		closedAt: any;
		tags: any;
		customFields: any;
		visitorId?: any;
		roomIds?: any;
		onhold: any;
		queued: any;
		options?: any;
		extraQuery?: any;
	}): FindPaginated<FindCursor<IOmnichannelRoom>>;

	getOnHoldConversationsBetweenDate(from: any, to: any, departmentId: any): any;

	findAllServiceTimeByAgent(params: Period & WithOptions & WithOnlyCount): any;

	findAllAverageServiceTimeByAgents(params: Period & WithOptions & WithOnlyCount): any;

	setDepartmentByRoomId(roomId: any, departmentId: any): any;

	findOpen(extraQuery?: Filter<IOmnichannelRoom>): FindCursor<IOmnichannelRoom>;

	setAutoTransferOngoingById(roomId: string): Promise<UpdateResult>;

	unsetAutoTransferOngoingById(roomId: string): Promise<UpdateResult>;

	setAutoTransferredAtById(roomId: string): Promise<UpdateResult>;

	findAvailableSources(): AggregationCursor<Document>;
	setPdfTranscriptFileIdById(rid: string, fileId: string): Promise<UpdateResult>;

	setEmailTranscriptRequestedByRoomId(
		rid: string,
		transcriptInfo: NonNullable<IOmnichannelRoom['transcriptRequest']>,
	): Promise<UpdateResult>;
	unsetEmailTranscriptRequestedByRoomId(rid: string): Promise<UpdateResult>;

	closeRoomById(roomId: string, closeInfo: IOmnichannelRoomClosingInfo, options?: UpdateOptions): Promise<UpdateResult>;

	bulkRemoveDepartmentAndUnitsFromRooms(departmentId: string): Promise<Document | UpdateResult>;
	findOneByIdOrName<T extends Document = IOmnichannelRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		_idOrName: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	updateSurveyFeedbackById(_id: string, surveyFeedback: unknown): Promise<UpdateResult>;
	updateDataByToken(token: string, key: string, value: string, overwrite?: boolean): Promise<UpdateResult | Document | boolean>;
	saveRoomById(
		data: { _id: string; topic?: string; tags?: string[]; livechatData?: Record<string, any> } & Record<string, unknown>,
	): Promise<UpdateResult | undefined>;
	findByIds(
		ids: string[],
		fields?: FindOptions<IOmnichannelRoom>['projection'],
		extraQuery?: Filter<IOmnichannelRoom>,
	): FindCursor<IOmnichannelRoom>;
	findOneByIdAndVisitorToken(
		_id: string,
		visitorToken: string,
		fields?: FindOptions<IOmnichannelRoom>['projection'],
	): Promise<IOmnichannelRoom | null>;
	findOneByVisitorTokenAndEmailThreadAndDepartment<
		T extends Document = IOmnichannelRoom,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		visitorToken: string,
		emailThread: string[],
		departmentId?: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	updateEmailThreadByRoomId(roomId: string, threadIds: string[] | string): Promise<UpdateResult>;
	findOneLastServedAndClosedByVisitorToken<
		T extends Document = IOmnichannelRoom,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		visitorToken: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneByVisitorToken(visitorToken: string, fields?: FindOptions<IOmnichannelRoom>['projection']): Promise<IOmnichannelRoom | null>;
	findOpenByVisitorToken<T extends Document = IOmnichannelRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		visitorToken: string,
		options?: O,
		extraQuery?: Filter<IOmnichannelRoom>,
	): FindCursor<DocumentWithProjection<T, O>>;
	findOneOpenByContactChannelVisitor<
		T extends Document = IOmnichannelRoom,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		association: ILivechatContactVisitorAssociation,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneOpenByVisitorToken<T extends Document = IOmnichannelRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		visitorToken: string,
		options?: O,
		extraQuery?: Filter<IOmnichannelRoom>,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneOpenByVisitorTokenAndDepartmentIdAndSource<
		T extends Document = IOmnichannelRoom,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		visitorToken: string,
		departmentId?: string,
		source?: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOpenByVisitorTokenAndDepartmentId<
		T extends Document = IOmnichannelRoom,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		visitorToken: string,
		departmentId: string,
		options?: O,
		extraQuery?: Filter<IOmnichannelRoom>,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByVisitorIdAndAgentId<T extends Document = IOmnichannelRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		visitorId?: string,
		agentId?: string,
		options?: O,
		extraQuery?: Filter<IOmnichannelRoom>,
	): FindCursor<DocumentWithProjection<T, O>>;
	findOneOpenByRoomIdAndVisitorToken<
		T extends Document = IOmnichannelRoom,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		roomId: string,
		visitorToken: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findClosedRooms<T extends Document = IOmnichannelRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		departmentIds?: string[],
		options?: O,
		extraQuery?: Filter<IOmnichannelRoom>,
	): FindCursor<DocumentWithProjection<T, O>>;
	getResponseByRoomIdUpdateQuery(
		responseBy: IOmnichannelRoom['responseBy'],
		updater?: Updater<IOmnichannelRoom>,
	): Updater<IOmnichannelRoom>;
	getNotResponseByRoomIdUpdateQuery(updater: Updater<IOmnichannelRoom>): Updater<IOmnichannelRoom>;
	getAgentLastMessageTsUpdateQuery(updater?: Updater<IOmnichannelRoom>): Updater<IOmnichannelRoom>;
	getAnalyticsUpdateQueryBySentByAgent(
		room: IOmnichannelRoom,
		message: IMessage,
		analyticsData: Record<string, string | number | Date> | undefined,
		updater?: Updater<IOmnichannelRoom>,
	): Updater<IOmnichannelRoom>;
	getAnalyticsUpdateQueryBySentByVisitor(
		room: IOmnichannelRoom,
		message: IMessage,
		updater?: Updater<IOmnichannelRoom>,
	): Updater<IOmnichannelRoom>;
	getTotalConversationsBetweenDate(t: 'l', date: { gte: Date; lte: Date }, data?: { departmentId: string }): Promise<number>;
	getAnalyticsMetricsBetweenDate(
		t: 'l',
		date: { gte: Date; lte: Date },
		data?: { departmentId?: string },
		extraQuery?: Filter<IOmnichannelRoom>,
	): FindCursor<Pick<IOmnichannelRoom, 'ts' | 'departmentId' | 'open' | 'servedBy' | 'responseBy' | 'metrics' | 'msgs'>>;
	getAnalyticsMetricsBetweenDateWithMessages(
		t: string,
		date: { gte: Date; lte: Date },
		data?: { departmentId?: string },
		extraQuery?: Document,
		extraMatchers?: Document,
	): AggregationCursor<Pick<IOmnichannelRoom, '_id' | 'ts' | 'departmentId' | 'open' | 'servedBy' | 'metrics' | 'msgs'>>;
	getAnalyticsBetweenDate(
		date: { gte: Date; lte: Date },
		data?: { departmentId: string },
	): AggregationCursor<Pick<IOmnichannelRoom, 'ts' | 'departmentId' | 'open' | 'servedBy' | 'metrics' | 'msgs' | 'onHold'>>;
	findOpenByAgent<T extends Document = IOmnichannelRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		extraQuery?: Filter<IOmnichannelRoom>,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	countOpenByAgent(userId: string, extraQuery?: Filter<IOmnichannelRoom>): Promise<number>;
	changeAgentByRoomId(roomId: string, newAgent: { agentId: string; username: string }): Promise<UpdateResult>;
	changeDepartmentIdByRoomId(roomId: string, departmentId: string): Promise<UpdateResult>;
	saveCRMDataByRoomId(roomId: string, crmData: unknown): Promise<UpdateResult>;
	updateVisitorStatus(token: string, status: ILivechatVisitor['status']): Promise<UpdateResult | Document>;
	removeAgentByRoomId(roomId: string): Promise<UpdateResult>;
	removeByVisitorId(_id: string): Promise<DeleteResult>;
	removeById(_id: string): Promise<DeleteResult>;
	getVisitorLastMessageTsUpdateQueryByRoomId(lastMessageTs: Date, updater?: Updater<IOmnichannelRoom>): Updater<IOmnichannelRoom>;
	setVisitorInactivityInSecondsById(roomId: string, visitorInactivity: any): Promise<UpdateResult>;
	unarchiveOneById(roomId: string): Promise<UpdateResult>;
	getVisitorActiveForPeriodUpdateQuery(
		period: string,
		updater?: Updater<IOmnichannelRoom>,
		currentActivity?: string[] | null,
	): Updater<IOmnichannelRoom>;
	getMACStatisticsForPeriod(period: string): Promise<MACStats[]>;
	getMACStatisticsBetweenDates(start: Date, end: Date): Promise<MACStats[]>;
	findNewestByContactVisitorAssociation<T extends Document = IOmnichannelRoom>(
		association: ILivechatContactVisitorAssociation,
		options?: Omit<FindOptions<IOmnichannelRoom>, 'sort' | 'limit'>,
	): Promise<T | null>;
	setContactByVisitorAssociation(
		association: ILivechatContactVisitorAssociation,
		contact: Pick<AtLeast<ILivechatContact, '_id'>, '_id' | 'name'>,
	): Promise<UpdateResult | Document>;
	findClosedRoomsByContactPaginated(params: { contactId: string; options?: FindOptions }): FindPaginated<FindCursor<IOmnichannelRoom>>;
	findClosedRoomsByContactAndSourcePaginated(params: {
		contactId: string;
		source?: string;
		options?: FindOptions;
	}): FindPaginated<FindCursor<IOmnichannelRoom>>;
	countLivechatRoomsWithDepartment(): Promise<number>;
	updateContactDataByContactId(
		oldContactId: ILivechatContact['_id'],
		contact: Partial<Pick<ILivechatContact, '_id' | 'name'>>,
	): Promise<UpdateResult | Document>;
	findOpenByContactId<T extends Document = IOmnichannelRoom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		contactId: ILivechatContact['_id'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	checkContactOpenRooms(contactId: ILivechatContact['_id']): Promise<Pick<IOmnichannelRoom, '_id'> | null>;
}

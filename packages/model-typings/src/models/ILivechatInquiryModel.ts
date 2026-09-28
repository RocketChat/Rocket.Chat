import type { IMessage, ILivechatInquiryRecord, LivechatInquiryStatus, SelectedAgent } from '@rocket.chat/core-typings';
import type { FindOptions, Document, UpdateResult, DeleteResult, FindCursor, DeleteOptions, AggregateOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface ILivechatInquiryModel extends IBaseModel<ILivechatInquiryRecord> {
	findOneByRoomId<T extends Document = ILivechatInquiryRecord, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		rid: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	getDistinctQueuedDepartments(options: AggregateOptions): Promise<{ _id: string | null }[]>;
	setDepartmentByInquiryId(inquiryId: string, department: string): Promise<ILivechatInquiryRecord | null>;
	setLastMessageByRoomId(rid: ILivechatInquiryRecord['rid'], message: IMessage): Promise<ILivechatInquiryRecord | null>;
	setLastMessageById(inquiryId: string, lastMessage: IMessage): Promise<UpdateResult>;
	findNextAndLock(
		queueSortBy: FindOptions<ILivechatInquiryRecord>['sort'],
		department: string | null,
	): Promise<ILivechatInquiryRecord | null>;
	unlock(inquiryId: string): Promise<UpdateResult>;
	unlockAll(): Promise<UpdateResult | Document>;
	getCurrentSortedQueueAsync(props: {
		inquiryId?: string;
		department?: string;
		queueSortBy: FindOptions<ILivechatInquiryRecord>['sort'];
	}): Promise<(Pick<ILivechatInquiryRecord, '_id' | 'rid' | 'name' | 'ts' | 'status' | 'department'> & { position: number })[]>;
	removeByRoomId(rid: string, options?: DeleteOptions): Promise<DeleteResult>;
	getQueuedInquiries<T extends Document = ILivechatInquiryRecord, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	takeInquiry(inquiryId: string, lockedAt?: Date): Promise<UpdateResult>;
	queueInquiry(inquiryId: string, lastMessage?: IMessage, defaultAgent?: SelectedAgent | null): Promise<ILivechatInquiryRecord | null>;
	queueInquiryAndRemoveDefaultAgent(inquiryId: string): Promise<UpdateResult>;
	readyInquiry(inquiryId: string): Promise<UpdateResult>;
	changeDepartmentIdByRoomId(rid: string, department: string): Promise<UpdateResult>;
	getStatus(inquiryId: string): Promise<ILivechatInquiryRecord['status'] | undefined>;
	updateVisitorStatus(token: string, status: ILivechatInquiryRecord['v']['status']): Promise<UpdateResult>;
	setDefaultAgentById(inquiryId: string, defaultAgent: ILivechatInquiryRecord['defaultAgent']): Promise<UpdateResult>;
	setNameByRoomId(rid: string, name: string): Promise<UpdateResult>;
	findOneByToken(token: string): Promise<ILivechatInquiryRecord | null>;
	removeDefaultAgentById(inquiryId: string): Promise<UpdateResult | Document>;
	markInquiryActiveForPeriod(rid: ILivechatInquiryRecord['rid'], period: string): Promise<ILivechatInquiryRecord | null>;
	setStatusById(inquiryId: string, status: LivechatInquiryStatus): Promise<ILivechatInquiryRecord>;
	updateNameByVisitorIds(visitorIds: string[], name: string): Promise<UpdateResult | Document>;
	findByVisitorIds<T extends Document = ILivechatInquiryRecord, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		visitorIds: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
}

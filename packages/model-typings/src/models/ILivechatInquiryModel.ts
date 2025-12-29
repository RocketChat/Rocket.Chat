import type { IMessage, ILivechatInquiryRecord, LivechatInquiryStatus, SelectedAgent } from '@rocket.chat/core-typings';
import type { FindOptions, Document, UpdateResult, DeleteResult, FindCursor, DeleteOptions, AggregateOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatInquiryModel extends IBaseModel<ILivechatInquiryRecord> {
	findOneQueuedByRoomId(rid: string): Promise<(ILivechatInquiryRecord & { status: LivechatInquiryStatus.QUEUED }) | null>;
	findOneByRoomId<T extends Document = ILivechatInquiryRecord>(
		rid: string,
		options?: FindOptions<T extends ILivechatInquiryRecord ? ILivechatInquiryRecord : T>,
	): Promise<T | null>;
	findOneReadyByRoomId<T extends Document = ILivechatInquiryRecord>(
		rid: string,
		options?: FindOptions<T extends ILivechatInquiryRecord ? ILivechatInquiryRecord : T>,
	): Promise<T | null>;
	getDistinctQueuedDepartments(options: AggregateOptions): Promise<{ _id: string | null }[]>;
	setDepartmentByInquiryId(inquiryId: ILivechatInquiryRecord['_id'], department: string): Promise<ILivechatInquiryRecord | null>;
	setLastMessageByRoomId(rid: ILivechatInquiryRecord['rid'], message: IMessage): Promise<ILivechatInquiryRecord | null>;
	setLastMessageById(inquiryId: ILivechatInquiryRecord['_id'], lastMessage: IMessage): Promise<UpdateResult>;
	findNextAndLock(
		queueSortBy: FindOptions<ILivechatInquiryRecord>['sort'],
		department: string | null,
	): Promise<ILivechatInquiryRecord | null>;
	unlock(inquiryId: ILivechatInquiryRecord['_id']): Promise<UpdateResult>;
	unlockAll(): Promise<UpdateResult | Document>;
	findIdsByVisitorId(_id: ILivechatInquiryRecord['v']['_id']): FindCursor<ILivechatInquiryRecord>;
	getCurrentSortedQueueAsync(props: {
		inquiryId?: ILivechatInquiryRecord['_id'];
		department?: string;
		queueSortBy: FindOptions<ILivechatInquiryRecord>['sort'];
	}): Promise<(Pick<ILivechatInquiryRecord, '_id' | 'rid' | 'name' | 'ts' | 'status' | 'department'> & { position: number })[]>;
	removeByRoomId(rid: string, options?: DeleteOptions): Promise<DeleteResult>;
	getQueuedInquiries(options?: FindOptions<ILivechatInquiryRecord>): FindCursor<ILivechatInquiryRecord>;
	takeInquiry(inquiryId: ILivechatInquiryRecord['_id'], lockedAt?: Date): Promise<UpdateResult>;
	openInquiry(inquiryId: ILivechatInquiryRecord['_id']): Promise<UpdateResult>;
	queueInquiry(
		inquiryId: ILivechatInquiryRecord['_id'],
		lastMessage?: IMessage,
		defaultAgent?: SelectedAgent | null,
	): Promise<ILivechatInquiryRecord | null>;
	queueInquiryAndRemoveDefaultAgent(inquiryId: ILivechatInquiryRecord['_id']): Promise<UpdateResult>;
	readyInquiry(inquiryId: ILivechatInquiryRecord['_id']): Promise<UpdateResult>;
	changeDepartmentIdByRoomId(rid: string, department: string): Promise<UpdateResult>;
	getStatus(inquiryId: ILivechatInquiryRecord['_id']): Promise<ILivechatInquiryRecord['status'] | undefined>;
	updateVisitorStatus(token: string, status: ILivechatInquiryRecord['v']['status']): Promise<UpdateResult>;
	setDefaultAgentById(
		inquiryId: ILivechatInquiryRecord['_id'],
		defaultAgent: ILivechatInquiryRecord['defaultAgent'],
	): Promise<UpdateResult>;
	setNameByRoomId(rid: string, name: string): Promise<UpdateResult>;
	findOneByToken(token: string): Promise<ILivechatInquiryRecord | null>;
	removeDefaultAgentById(inquiryId: ILivechatInquiryRecord['_id']): Promise<UpdateResult | Document>;
	removeByVisitorToken(token: string): Promise<void>;
	markInquiryActiveForPeriod(rid: ILivechatInquiryRecord['rid'], period: string): Promise<ILivechatInquiryRecord | null>;
	findIdsByVisitorToken(token: ILivechatInquiryRecord['v']['token']): FindCursor<ILivechatInquiryRecord>;
	setStatusById(inquiryId: ILivechatInquiryRecord['_id'], status: LivechatInquiryStatus): Promise<ILivechatInquiryRecord>;
	updateNameByVisitorIds(visitorIds: string[], name: string): Promise<UpdateResult | Document>;
	findByVisitorIds(visitorIds: string[], options?: FindOptions<ILivechatInquiryRecord>): FindCursor<ILivechatInquiryRecord>;
}

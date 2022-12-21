import type { ILivechatInquiryRecord, ILivechatPriority } from '@rocket.chat/core-typings';
import type { ILivechatInquiryModel } from '@rocket.chat/model-typings';
import type { ModifyResult, UpdateResult, Document } from 'mongodb';

import { LivechatInquiryRaw } from '../../../../server/models/raw/LivechatInquiry';

declare module '@rocket.chat/model-typings' {
	export interface ILivechatInquiryModel {
		setSlaForRoom(
			rid: string,
			sla: { estimatedWaitingTimeQueue: number; estimatedServiceTimeAt: Date; slaId: string },
		): Promise<ModifyResult<ILivechatInquiryRecord>>;
		bulkUnsetSla(roomIds: string[]): Promise<Document | UpdateResult>;
		setPriorityForRoom(rid: string, priority: Pick<ILivechatPriority, '_id' | 'sortItem'>): Promise<ModifyResult<ILivechatInquiryRecord>>;
		unsetPriorityForRoom(rid: string): Promise<ModifyResult<ILivechatInquiryRecord>>;
	}
}

// Note: Expect a circular dependency error here 😓
export class LivechatInquiryRawEE extends LivechatInquiryRaw implements ILivechatInquiryModel {
	setSlaForRoom(
		rid: string,
		sla: { estimatedWaitingTimeQueue: number; estimatedServiceTimeAt: Date; slaId: string },
	): Promise<ModifyResult<ILivechatInquiryRecord>> {
		const { estimatedWaitingTimeQueue, estimatedServiceTimeAt, slaId } = sla;

		return this.findOneAndUpdate(
			{ rid },
			{
				$set: {
					slaId,
					estimatedServiceTimeAt,
					estimatedWaitingTimeQueue,
				},
			},
		);
	}

	bulkUnsetSla(roomIds: string[]): Promise<Document | UpdateResult> {
		return this.updateMany(
			{
				rid: { $in: roomIds },
			},
			{
				$unset: {
					estimatedServiceTimeAt: 1,
					estimatedWaitingTimeQueue: 1,
				},
			},
		);
	}

	setPriorityForRoom(rid: string, priority: Pick<ILivechatPriority, '_id' | 'sortItem'>): Promise<ModifyResult<ILivechatInquiryRecord>> {
		return this.findOneAndUpdate(
			{ rid },
			{
				$set: {
					priorityId: priority._id,
					priorityWeight: priority.sortItem,
				},
			},
		);
	}

	unsetPriorityForRoom(rid: string): Promise<ModifyResult<ILivechatInquiryRecord>> {
		return this.findOneAndUpdate(
			{ rid },
			{
				$unset: {
					priorityId: 1,
					priorityWeight: 1,
				},
			},
		);
	}
}

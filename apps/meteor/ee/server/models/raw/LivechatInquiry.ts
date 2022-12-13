import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import type { ILivechatInquiryModel } from '@rocket.chat/model-typings';
import type { ModifyResult, UpdateResult, Document } from 'mongodb';

import { LivechatInquiryRaw } from '../../../../server/models/raw/LivechatInquiry';

declare module '@rocket.chat/model-typings' {
	export interface ILivechatInquiryModel {
		setSla(
			rid: string,
			sla: { estimatedWaitingTimeQueue: number; estimatedServiceTimeAt: Date },
		): Promise<ModifyResult<ILivechatInquiryRecord>>;
		bulkUnsetSla(roomIds: string[]): Promise<Document | UpdateResult>;
	}
}

// Note: Expect a circular dependency error here 😓
export class LivechatInquiryRawEE extends LivechatInquiryRaw implements ILivechatInquiryModel {
	setSla(
		rid: string,
		sla: { estimatedWaitingTimeQueue: number; estimatedServiceTimeAt: Date },
	): Promise<ModifyResult<ILivechatInquiryRecord>> {
		const { estimatedWaitingTimeQueue, estimatedServiceTimeAt } = sla;

		return this.findOneAndUpdate(
			{ rid },
			{
				$set: {
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
}

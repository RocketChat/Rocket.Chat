import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import type { ILivechatInquiryModel } from '@rocket.chat/model-typings';
import type { ModifyResult } from 'mongodb';

import { LivechatInquiryRaw } from '../../../../server/models/raw/LivechatInquiry';

declare module '@rocket.chat/model-typings' {
	export interface ILivechatInquiryModel {
		setEstimatedServiceTimeAt(
			rid: string,
			data: { estimatedWaitingTimeQueue: number; estimatedServiceTimeAt: string },
		): Promise<ModifyResult<ILivechatInquiryRecord>>;
	}
}

// Note: Expect a circular dependency error here 😓
export class LivechatInquiryRawEE extends LivechatInquiryRaw implements ILivechatInquiryModel {
	setEstimatedServiceTimeAt(
		rid: string,
		data: { estimatedWaitingTimeQueue: number; estimatedServiceTimeAt: string },
	): Promise<ModifyResult<ILivechatInquiryRecord>> {
		const { estimatedWaitingTimeQueue, estimatedServiceTimeAt } = data;

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
}

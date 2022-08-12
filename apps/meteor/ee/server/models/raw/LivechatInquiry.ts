import { registerModel } from '@rocket.chat/models';
import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import type { UpdateResult } from 'mongodb';

import { LivechatInquiryRaw } from '../../../../server/models/raw/LivechatInquiry';
import { overwriteClassOnLicense } from '../../../app/license/server';
import { db } from '../../../../server/database/utils';

declare module '@rocket.chat/model-typings' {
	interface ILivechatInquiryModel {
		setEstimatedServiceTimeAt?(
			rid: string,
			data: Pick<ILivechatInquiryRecord, 'queueOrder' | 'estimatedServiceTimeAt' | 'estimatedWaitingTimeQueue'>,
		): Promise<UpdateResult>;
	}
}

overwriteClassOnLicense('livechat-enterprise', LivechatInquiryRaw, {
	setEstimatedServiceTimeAt(_: Function, rid, data = {}) {
		const { queueOrder, estimatedWaitingTimeQueue, estimatedServiceTimeAt } = data;

		return this.updateOne(
			{ rid },
			{
				$set: {
					queueOrder,
					estimatedServiceTimeAt,
					estimatedWaitingTimeQueue,
				},
			},
		);
	},
});

registerModel('ILivechatInquiryModel', new LivechatInquiryRaw(db));

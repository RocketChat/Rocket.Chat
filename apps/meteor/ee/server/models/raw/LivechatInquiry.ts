import { registerModel } from '@rocket.chat/models';

import { LivechatInquiryRaw } from '../../../../server/models/raw/LivechatInquiry';
import { overwriteClassOnLicense } from '../../../app/license/server';
import { db } from '../../../../server/database/utils';

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

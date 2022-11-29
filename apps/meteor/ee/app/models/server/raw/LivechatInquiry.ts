import { LivechatInquiryRaw } from '../../../../../server/models/raw/LivechatInquiry';
import { overwriteClassOnLicense } from '../../../license/server';

overwriteClassOnLicense('livechat-enterprise', LivechatInquiryRaw, {
	setEstimatedServiceTimeAt(rid: string, data: { estimatedWaitingTimeQueue: number; estimatedServiceTimeAt: number }) {
		const { estimatedWaitingTimeQueue, estimatedServiceTimeAt } = data;

		return this.update(
			{ rid },
			{
				$set: {
					estimatedServiceTimeAt,
					estimatedWaitingTimeQueue,
				},
			},
		);
	},
});

import { LivechatInquiry } from '../../../../../app/models/server/models/LivechatInquiry';

LivechatInquiry.prototype.setEstimatedServiceTimeAt = function (rid, data = {}) {
	const { queueOrder, estimatedWaitingTimeQueue, estimatedServiceTimeAt } = data;

	return this.update(
		{ rid },
		{
			$set: {
				queueOrder,
				estimatedServiceTimeAt,
				estimatedWaitingTimeQueue,
			},
		},
	);
};

export default LivechatInquiry;

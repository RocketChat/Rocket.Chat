import { LivechatInquiry } from '../../../../../app/models/server/models/LivechatInquiry';

LivechatInquiry.prototype.setEstimatedServiceTimeAt = function (rid, data = {}) {
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
};

export default LivechatInquiry;

import { LivechatInquiry } from '../../../../../app/models/server/models/LivechatInquiry';

LivechatInquiry.prototype.setEstimatedServiceTimeAt = function(rid, data = {}) {
	const { defaultEstimatedServiceTime, estimatedServiceTimeAt } = data;

	return this.update(
		{ rid },
		{
			$set: {
				estimatedServiceTimeAt,
				defaultEstimatedServiceTime,
			},
		},
	);
};

export default LivechatInquiry;

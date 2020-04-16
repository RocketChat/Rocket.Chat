import { LivechatInquiry } from '../../../../../app/models/server/models/LivechatInquiry';

LivechatInquiry.prototype.setEstimatedServiceTimeAt = function(rid, estimatedServiceTimeInMinutes) {
	const self = this;
	this.find({ rid }, { ts: 1 }).forEach(function(inq) {
		const { ts } = inq;
		const estimatedServiceTimeAt = new Date(ts.setMinutes(ts.getMinutes() + estimatedServiceTimeInMinutes));

		self.update(
			{ rid },
			{
				$set: {
					estimatedServiceTimeAt,
					defaultEstimatedServiceTime: false,
				},
			},
		);
	});
};

LivechatInquiry.prototype.unsetEstimatedServiceTimeAt = function(rid) {
	const self = this;
	this.find({ rid }, { ts: 1 }).forEach(function(inq) {
		const { ts: estimatedServiceTimeAt } = inq;

		self.update(
			{ rid },
			{
				$set: {
					estimatedServiceTimeAt,
					defaultEstimatedServiceTime: true,
				},
			},
		);
	});
};

export default LivechatInquiry;

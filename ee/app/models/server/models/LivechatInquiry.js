import { LivechatInquiry } from '../../../../../app/models/server/models/LivechatInquiry';

LivechatInquiry.prototype.setEstimatedServiceTimeAt = function(/* rid, estimatedServiceTimeInSeconds */) {
	/*
	if (!priority) {
		return this.update({ rid }, {
			$unset: {
				'omnichannel.priority': 1,
			},
		});
	}
	return this.update({ rid }, {
		$set: {
			'omnichannel.priority': {
				_id: priority._id,
				name: priority.name,
				dueTimeInMinutes: parseInt(priority.dueTimeInMinutes),
			},
			custom: {
				avatar: {
					color: priority.color,
				},
			},
		},
	});
	*/
};

LivechatInquiry.prototype.unsetEstimatedServiceTimeAt = function(priorityId) {
	return this.update({
		'omnichannel.priority._id': priorityId,
	},
	{
		$unset: {
			'omnichannel.priority': 1,
		},
	});
};

export default LivechatInquiry;

import { Subscriptions } from '../../../../../app/models/server/models/Subscriptions';

Subscriptions.prototype.setPriorityByRoomId = function(rid, priority) {
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
		},
	});
};

Subscriptions.prototype.updatePriorityDataByPriorityId = function(priorityId, priorityData) {
	return this.update({
		'omnichannel.priority._id': priorityId,
		open: true,
	},
	{
		$set: {
			'omnichannel.priority.name': priorityData.name,
			'omnichannel.priority.dueTimeInMinutes': parseInt(priorityData.dueTimeInMinutes),
		},
	});
};

Subscriptions.prototype.unsetPriorityByPriorityId = function(priorityId) {
	return this.update({
		'omnichannel.priority._id': priorityId,
		open: true,
	},
	{
		$unset: {
			'omnichannel.priority': 1,
		},
	});
};

export default Subscriptions;

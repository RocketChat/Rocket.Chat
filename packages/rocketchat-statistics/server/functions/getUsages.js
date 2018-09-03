

export function getUsages() {
	const lastStatistics = RocketChat.models.Statistics.findLast();
	const lastStatisticsCreatedAt = lastStatistics ? lastStatistics.createdAt : new Date();
	const userDB = RocketChat.models.Users;
	const subDB = RocketChat.models.Subscriptions;
	const messageDB = RocketChat.models.Messages;
	const usages = [];
	const users = userDB.model.aggregate([
		{
			$unwind: '$emails'
		},
		{
			$project: { '_id': 1, 'emails.address': 1 }
		}
	]);

	const readsArr = subDB.model.aggregate([
		{
			$match:
				{
					ts: { $gt: new Date(lastStatisticsCreatedAt.toISOString()) }
				}
		},
		{
			$group:
				{
					_id: { uid: '$u._id', subType: '$t'},
					subs: { $sum: 1 }
				}
		},
		{
			$group:
				{
					_id: '$_id.uid',
					roomTypes: {
						$addToSet:
								{
									type: '$_id.subType',
									subscriptions: '$subs'
								}
					}
				}
		}
	]);
	const reads = new Map(readsArr.map((i) => [i._id, i.roomTypes]));

	const writesArr = messageDB.model.aggregate([
		{
			$match:
				{
					ts: { $gt: new Date(lastStatisticsCreatedAt.toISOString()) }
				}
		},
		{
			$lookup:
				{
					from: 'rocketchat_room',
					localField: 'rid',
					foreignField: '_id',
					as: 'msgRooms'
				}
		},
		{
			$unwind: '$msgRooms'
		},
		{
			$group:
				{
					_id: { uid: '$u._id', msgRoom: '$msgRooms.t'},
					messages: { $sum: 1 }
				}
		},
		{
			$group:
				{
					_id: '$_id.uid',
					roomTypes: {
						$addToSet:
								{
									type: '$_id.msgRoom',
									messages: '$messages'
								}
					}
				}
		}
	]);
	const writes = new Map(writesArr.map((i) => [i._id, i.roomTypes]));

	for (let i = 0; i < users.length; i++) {
		const user = users[i];
		let active = false;
		if (reads.has(user._id)) {
			user.reads = reads.get(user._id);
			active = true;
		} else {
			user.reads = {};
		}
		if (writes.has(user._id)) {
			user.writes = writes.get(user._id);
			active = true;
		} else {
			user.writes = {};
		}
		user.active = active;
		user._id = SHA256(user.emails.address);
		delete user.emails.address;
		delete user.emails;
		usages.push(user);

	}
	return usages;
}

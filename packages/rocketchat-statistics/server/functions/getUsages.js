import { SHA256 } from 'meteor/meteor-sha';

/**
 * This function adds anonymized statistics about how users interact (read and write) with the system
 */
export function getUsages() {
	const lastStatistics = RocketChat.models.Statistics.findLast();
	const lastStatisticsCreatedAt = lastStatistics ? lastStatistics.createdAt : new Date();
	const userDB = RocketChat.models.Users.model.rawCollection();
	const subDB = RocketChat.models.Subscriptions.model.rawCollection();
	const messageDB = RocketChat.models.Messages.model.rawCollection();
	const usages = [];
	const usersAggregationCursor = userDB.aggregate([
		{
			$unwind: '$emails',
		},
		{
			$project: { _id: 1, 'emails.address': 1 },
		},
	]);

	const users = Promise.await(usersAggregationCursor.toArray());

	const readsAggregationCursor = subDB.aggregate([
		{
			$match:
				{
					ts: { $gt: new Date(lastStatisticsCreatedAt.toISOString()) },
				},
		},
		{
			$group:
				{ // if the room contains a parentRoomId it is actually a thread, therefor marked as roomtype 'thread'
					_id: { uid: '$u._id', subType: { $cond: [{ $not: ['$parentRoomId'] }, '$t', 'thread'] } },
					subs: { $sum: 1 },
				},
		},
		{
			$group:
				{
					_id: '$_id.uid',
					roomTypes: {
						$addToSet:
								{
									type: '$_id.subType',
									subscriptions: '$subs',
								},
					},
				},
		},
	]);

	const readsArr = Promise.await(readsAggregationCursor.toArray());
	const reads = new Map(readsArr.map((i) => [i._id, i.roomTypes]));

	const writesAggregationCursor = messageDB.aggregate([
		{
			$match:
				{
					ts: { $gt: new Date(lastStatisticsCreatedAt.toISOString()) },
				},
		},
		{
			$lookup:
				{
					from: 'rocketchat_room',
					localField: 'rid',
					foreignField: '_id',
					as: 'msgRooms',
				},
		},
		{
			$unwind: '$msgRooms',
		},
		{
			$group:
				{ // if the room contains a parentRoomId it is actually a thread, therefor marked as roomtype 'thread'
					_id: { uid: '$u._id', msgRoom: { $cond: [{ $not: ['$msgRooms.parentRoomId'] }, '$msgRooms.t', 'thread'] } },
					messages: { $sum: 1 },
				},
		},
		{
			$group:
				{
					_id: '$_id.uid',
					roomTypes: {
						$addToSet:
								{
									type: '$_id.msgRoom',
									messages: '$messages',
								},
					},
				},
		},
	]);

	const writesArr = Promise.await(writesAggregationCursor.toArray());
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

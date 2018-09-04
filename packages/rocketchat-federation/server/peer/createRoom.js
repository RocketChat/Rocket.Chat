export const createRoom = (source, target) => {
	const rid = [source._id, target._id].sort().join('');

	const room = RocketChat.models.Rooms.upsert(
		{ _id: rid },
		{
			$set: {
				usernames: [source.username, target.username],
			},
			$setOnInsert: {
				t: 'd',
				msgs: 0,
				ts: new Date(),
			},
		}
	);

	RocketChat.models.Subscriptions.upsert(
		{ rid, 'u._id': target._id },
		{
			$setOnInsert: {
				name: source.username,
				t: 'd',
				open: true,
				alert: false,
				unread: 0,
				u: {
					_id: target._id,
					username: target.username,
				},
			},
		}
	);

	RocketChat.models.Subscriptions.upsert(
		{ rid, 'u._id': source._id },
		{
			$setOnInsert: {
				name: target.username,
				t: 'd',
				open: true,
				alert: false,
				unread: 0,
				u: {
					_id: source._id,
					username: source.username,
				},
			},
		}
	);

	return {
    _id: rid,
    t: 'd'
  };
};

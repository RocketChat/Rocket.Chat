export default function createDirectSubscriptions(room, sourceUser, targetUser) {
	const { _id: roomId } = room;

	RocketChat.models.Subscriptions.upsert(
		{ rid: roomId, 'u._id': targetUser._id },
		{
			$setOnInsert: {
				name: sourceUser.username,
				t: 'd',
				open: true,
				alert: false,
				unread: 0,
				u: {
					_id: targetUser._id,
					username: targetUser.username,
				},
			},
		}
	);

	RocketChat.models.Subscriptions.upsert(
		{ rid: roomId, 'u._id': sourceUser._id },
		{
			$setOnInsert: {
				name: targetUser.username,
				t: 'd',
				open: true,
				alert: false,
				unread: 0,
				u: {
					_id: sourceUser._id,
					username: sourceUser.username,
				},
			},
		}
	);
}

export function findChannelByIdAndUser({ params, options = {} }) {
	const sub = RocketChat.models.Subscriptions.findOne({
		rid: params.roomId,
		'u._id': params.userId
	}, options);

	return sub;
}

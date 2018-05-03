Meteor.methods({
	/**
	 DEPRECATED
	 // TODO: Remove this after three versions have been released. That means at 0.67 this should be gone.
	 */
	cleanChannelHistory({ roomId, latest, oldest, inclusive }) {
		console.warn('The method "cleanChannelHistory" is deprecated and will be removed after version 0.67, please use "cleanRoomHistory" instead');
		Meteor.call('cleanRoomHistory', { roomId, latest, oldest, inclusive });
	}
});

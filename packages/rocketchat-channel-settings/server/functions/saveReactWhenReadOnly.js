RocketChat.saveReactWhenReadOnly = function(rid, allowReact) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', { function: 'RocketChat.saveReactWhenReadOnly' });
	}

	return RocketChat.models.Rooms.setAllowReactingWhenReadOnlyById(rid, allowReact);
};

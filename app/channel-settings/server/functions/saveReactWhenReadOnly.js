import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Rooms } from '/app/models';

export const saveReactWhenReadOnly = function(rid, allowReact) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', { function: 'RocketChat.saveReactWhenReadOnly' });
	}

	return Rooms.setAllowReactingWhenReadOnlyById(rid, allowReact);
};

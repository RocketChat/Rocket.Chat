import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.saveReactWhenReadOnly = function(rid, allowReact) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', { function: 'RocketChat.saveReactWhenReadOnly' });
	}

	return RocketChat.models.Rooms.setAllowReactingWhenReadOnlyById(rid, allowReact);
};

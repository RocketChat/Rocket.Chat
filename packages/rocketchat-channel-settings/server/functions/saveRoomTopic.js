import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.saveRoomTopic = function(rid, roomTopic, user, sendMessage = true) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomTopic',
		});
	}

	const update = RocketChat.models.Rooms.setTopicById(rid, roomTopic);
	if (update && sendMessage) {
		RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', rid, roomTopic, user);
	}
	return update;
};

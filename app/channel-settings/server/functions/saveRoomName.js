import { Meteor } from 'meteor/meteor';

import { Rooms, Messages, Subscriptions } from '../../../models/server';
import { Integrations } from '../../../models/server/raw';
import { getValidRoomName } from '../../../utils/server';
import { callbacks } from '../../../../lib/callbacks';
import { checkUsernameAvailability } from '../../../lib/server/functions';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';

const updateRoomName = (rid, displayName, isDiscussion) => {
	if (isDiscussion) {
		return Rooms.setFnameById(rid, displayName) && Subscriptions.updateFnameByRoomId(rid, displayName);
	}
	const slugifiedRoomName = getValidRoomName(displayName, rid);

	// Check if the username is available
	if (!checkUsernameAvailability(slugifiedRoomName)) {
		throw new Meteor.Error('error-duplicate-handle', `A room, team or user with name '${slugifiedRoomName}' already exists`, {
			function: 'RocketChat.updateRoomName',
			handle: slugifiedRoomName,
		});
	}

	return (
		Rooms.setNameById(rid, slugifiedRoomName, displayName) && Subscriptions.updateNameAndAlertByRoomId(rid, slugifiedRoomName, displayName)
	);
};

export async function saveRoomName(rid, displayName, user, sendMessage = true) {
	const room = Rooms.findOneById(rid);
	if (roomCoordinator.getRoomDirectives(room.t)?.preventRenaming()) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			function: 'RocketChat.saveRoomdisplayName',
		});
	}
	if (displayName === room.name) {
		return;
	}
	const isDiscussion = Boolean(room && room.prid);
	const update = updateRoomName(rid, displayName, isDiscussion);
	if (!update) {
		return;
	}

	await Integrations.updateRoomName(room.name, displayName);
	if (sendMessage) {
		Messages.createRoomRenamedWithRoomIdRoomNameAndUser(rid, displayName, user);
	}
	callbacks.run('afterRoomNameChange', { rid, name: displayName, oldName: room.name });
	return displayName;
}
